import psycopg2
import pandas as pd


# --------------------------------------------------
# 1. Connect to PostgreSQL
# --------------------------------------------------

import os
import psycopg2
import pandas as pd
from dotenv import load_dotenv

load_dotenv()


conn = psycopg2.connect(
    host=os.getenv("DB_HOST", "localhost"),
    database=os.getenv("DB_NAME", "placement_analytics"),
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT", "5432")
)

# --------------------------------------------------
# 2. Fetch placement data
# --------------------------------------------------

query = """
SELECT
    s.student_id,
    s.student_name,
    b.branch_name,
    s.graduation_year,
    c.company_name,
    p.package
FROM students s
LEFT JOIN branches b
    ON s.branch_id = b.branch_id
LEFT JOIN placements p
    ON s.student_id = p.student_id
LEFT JOIN companies c
    ON p.company_id = c.company_id
ORDER BY s.student_id;
"""

df = pd.read_sql(query, conn)

conn.close()


# --------------------------------------------------
# 3. Add placement status
# --------------------------------------------------

df["placement_status"] = df["package"].apply(
    lambda x: "Placed" if pd.notna(x) else "Unplaced"
)


# --------------------------------------------------
# 4. Branch Analysis
# --------------------------------------------------

branch_analysis = (
    df.groupby("branch_name")
    .agg(
        total_students=("student_id", "count"),
        placed_students=("package", lambda x: x.notna().sum()),
        average_package=("package", "mean"),
        highest_package=("package", "max")
    )
    .reset_index()
)

branch_analysis["placement_rate"] = (
    branch_analysis["placed_students"]
    / branch_analysis["total_students"]
    * 100
)

branch_analysis["average_package"] = branch_analysis[
    "average_package"
].round(2)

branch_analysis["highest_package"] = branch_analysis[
    "highest_package"
].round(2)

branch_analysis["placement_rate"] = branch_analysis[
    "placement_rate"
].round(2)


# --------------------------------------------------
# 5. Company Analysis
# --------------------------------------------------

company_analysis = (
    df[df["placement_status"] == "Placed"]
    .groupby("company_name")
    .agg(
        students_hired=("student_id", "count"),
        average_package=("package", "mean"),
        highest_package=("package", "max")
    )
    .reset_index()
)

company_analysis["average_package"] = company_analysis[
    "average_package"
].round(2)

company_analysis["highest_package"] = company_analysis[
    "highest_package"
].round(2)

company_analysis = company_analysis.sort_values(
    "students_hired",
    ascending=False
)


# --------------------------------------------------
# 6. Year Analysis
# --------------------------------------------------

year_analysis = (
    df.groupby("graduation_year")
    .agg(
        total_students=("student_id", "count"),
        placed_students=("package", lambda x: x.notna().sum()),
        average_package=("package", "mean"),
        highest_package=("package", "max")
    )
    .reset_index()
)

year_analysis["placement_rate"] = (
    year_analysis["placed_students"]
    / year_analysis["total_students"]
    * 100
)

year_analysis["average_package"] = year_analysis[
    "average_package"
].round(2)

year_analysis["highest_package"] = year_analysis[
    "highest_package"
].round(2)

year_analysis["placement_rate"] = year_analysis[
    "placement_rate"
].round(2)


# --------------------------------------------------
# 7. Package Analysis
# --------------------------------------------------

package_bins = [0, 5, 10, 20, float("inf")]

package_labels = [
    "<5 LPA",
    "5-10 LPA",
    "10-20 LPA",
    "20+ LPA"
]

placed_df = df[df["package"].notna()].copy()

placed_df["package_range"] = pd.cut(
    placed_df["package"],
    bins=package_bins,
    labels=package_labels,
    right=False
)

package_analysis = (
    placed_df.groupby(
        "package_range",
        observed=False
    )
    .size()
    .reset_index(name="students")
)


# --------------------------------------------------
# 8. Export everything to Excel
# --------------------------------------------------

output_file = "placement_analysis.xlsx"

with pd.ExcelWriter(
    output_file,
    engine="openpyxl",
    mode="a",
    if_sheet_exists="replace"
) as writer:

    df.to_excel(
        writer,
        sheet_name="Raw_Data",
        index=False
    )

    branch_analysis.to_excel(
        writer,
        sheet_name="Branch_Analysis",
        index=False
    )

    company_analysis.to_excel(
        writer,
        sheet_name="Company_Analysis",
        index=False
    )

    year_analysis.to_excel(
        writer,
        sheet_name="Year_Analysis",
        index=False
    )

    package_analysis.to_excel(
        writer,
        sheet_name="Package_Analysis",
        index=False
    )


print("Excel analysis created successfully!")
print(f"File: {output_file}")
print(f"Total students: {len(df)}")