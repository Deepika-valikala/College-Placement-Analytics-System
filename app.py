from flask import Flask, render_template, jsonify, request
import psycopg2

app = Flask(__name__)

conn = psycopg2.connect(
    host="localhost",
    database="placement_analytics",
    user="postgres",
    password="postgres",
    port="5432"
)

@app.route("/")
def home():
    cur = conn.cursor()

    # Total students
    cur.execute("SELECT COUNT(*) FROM students")
    total_students = cur.fetchone()[0]

    # Placed students
    cur.execute("SELECT COUNT(*) FROM placements")
    placed_students = cur.fetchone()[0]

    # Average package
    cur.execute("SELECT ROUND(AVG(package),2) FROM placements")
    avg_package = cur.fetchone()[0]

    cur.execute("SELECT MAX(package) FROM placements")
    highest_package = cur.fetchone()[0]

    placement_rate = round((placed_students / total_students) * 100, 2)

    cur.close()

    return render_template(
    "index.html",
    total_students=total_students,
    placed_students=placed_students,
    avg_package=avg_package,
    highest_package=highest_package,
    placement_rate=placement_rate
)
@app.route("/api/branch-placement")
def branch_placement():

    cur = conn.cursor()

    cur.execute("""
        SELECT
            b.branch_name,
            COUNT(p.student_id)
        FROM branches b
        LEFT JOIN students s
            ON b.branch_id = s.branch_id
        LEFT JOIN placements p
            ON s.student_id = p.student_id
        GROUP BY b.branch_name
        ORDER BY b.branch_name;
    """)

    rows = cur.fetchall()

    cur.close()

    labels = [row[0] for row in rows]
    values = [row[1] for row in rows]

    return jsonify({
        "labels": labels,
        "values": values
    })
@app.route("/api/company-hiring")
def company_hiring():

    cur = conn.cursor()

    cur.execute("""
        SELECT
            c.company_name,
            COUNT(*)
        FROM companies c
        JOIN placements p
            ON c.company_id = p.company_id
        GROUP BY c.company_name
        ORDER BY COUNT(*) DESC;
    """)

    rows = cur.fetchall()

    cur.close()

    labels = [r[0] for r in rows]
    values = [r[1] for r in rows]

    return jsonify({
        "labels": labels,
        "values": values
    })
@app.route("/api/year-placement")
def year_placement():

    cur = conn.cursor()

    cur.execute("""
        SELECT
            s.graduation_year,
            COUNT(*)
        FROM students s
        JOIN placements p
            ON s.student_id = p.student_id
        GROUP BY s.graduation_year
        ORDER BY s.graduation_year;
    """)

    rows = cur.fetchall()
    cur.close()

    labels = [str(row[0]) for row in rows]
    values = [row[1] for row in rows]

    return jsonify({
        "labels": labels,
        "values": values
    })
@app.route("/api/package-distribution")
def package_distribution():

    cur = conn.cursor()

    cur.execute("""
        SELECT
            CASE
                WHEN package < 5 THEN '<5 LPA'
                WHEN package BETWEEN 5 AND 10 THEN '5-10 LPA'
                WHEN package BETWEEN 10 AND 20 THEN '10-20 LPA'
                ELSE '20+ LPA'
            END AS package_range,
            COUNT(*)
        FROM placements
        GROUP BY package_range
        ORDER BY package_range;
    """)

    rows = cur.fetchall()
    cur.close()

    labels = [row[0] for row in rows]
    values = [row[1] for row in rows]

    return jsonify({
        "labels": labels,
        "values": values
    })
@app.route("/api/students")
def students():

    cur = conn.cursor()

    cur.execute("""
    SELECT
    s.student_name,
    b.branch_name,
    c.company_name,
    p.package,
    s.graduation_year

    FROM placements p

    JOIN students s
    ON s.student_id=p.student_id

    JOIN branches b
    ON s.branch_id=b.branch_id

    JOIN companies c
    ON c.company_id=p.company_id
    """)

    data=cur.fetchall()

    cur.close()

    return jsonify(data)
@app.route("/api/branches")
def get_branches():
    cur = conn.cursor()

    cur.execute("""
        SELECT branch_name
        FROM branches
        ORDER BY branch_name
    """)

    branches = [row[0] for row in cur.fetchall()]

    cur.close()

    return jsonify(branches)
@app.route("/api/companies")
def get_companies():
    cur = conn.cursor()

    cur.execute("""
        SELECT company_name
        FROM companies
        ORDER BY company_name
    """)

    companies = [row[0] for row in cur.fetchall()]

    cur.close()

    return jsonify(companies)
@app.route("/api/years")
def get_years():
    cur = conn.cursor()

    cur.execute("""
        SELECT DISTINCT graduation_year
        FROM students
        ORDER BY graduation_year
    """)

    years = [row[0] for row in cur.fetchall()]

    cur.close()

    return jsonify(years)
@app.route("/api/dashboard")
@app.route("/api/dashboard")
def dashboard():

    branch = request.args.get("branch", "")
    year = request.args.get("year", "")
    company = request.args.get("company", "")
    status = request.args.get("status", "")
    search = request.args.get("search", "")

    # ---------------------------------------------------
    # BASE QUERY
    # Used for Total Students
    # Does NOT apply status filter
    # ---------------------------------------------------

    base_query = """
        SELECT COUNT(*)
        FROM students s
        LEFT JOIN branches b
            ON s.branch_id = b.branch_id
        LEFT JOIN placements p
            ON s.student_id = p.student_id
        LEFT JOIN companies c
            ON p.company_id = c.company_id
        WHERE 1=1
    """

    base_params = []

    if branch:
        base_query += " AND b.branch_name=%s"
        base_params.append(branch)

    if year:
        base_query += " AND s.graduation_year=%s"
        base_params.append(year)

    if company:
        base_query += " AND c.company_name=%s"
        base_params.append(company)

    if search:
        base_query += " AND s.student_name ILIKE %s"
        base_params.append(f"%{search}%")

    cur = conn.cursor()

    cur.execute(base_query, base_params)
    total_students = cur.fetchone()[0]

    # ---------------------------------------------------
    # MAIN QUERY
    # Used for filtered students/charts
    # ---------------------------------------------------

    query = """
        SELECT
            s.student_name,
            b.branch_name,
            c.company_name,
            p.package,
            s.graduation_year
        FROM students s
        LEFT JOIN branches b
            ON s.branch_id = b.branch_id
        LEFT JOIN placements p
            ON s.student_id = p.student_id
        LEFT JOIN companies c
            ON p.company_id = c.company_id
        WHERE 1=1
    """

    params = []

    if branch:
        query += " AND b.branch_name=%s"
        params.append(branch)

    if year:
        query += " AND s.graduation_year=%s"
        params.append(year)

    if company:
        query += " AND c.company_name=%s"
        params.append(company)

    # Status filter applies ONLY to filtered rows
    if status == "placed":
        query += " AND p.student_id IS NOT NULL"

    elif status == "unplaced":
        query += " AND p.student_id IS NULL"

    if search:
        query += " AND s.student_name ILIKE %s"
        params.append(f"%{search}%")

    cur.execute(query, params)
    rows = cur.fetchall()

    cur.close()

    # ---------------------------------------------------
    # PLACED STUDENTS
    # ---------------------------------------------------

    placed = sum(
        1 for r in rows
        if r[3] is not None
    )

    # ---------------------------------------------------
    # AVERAGE PACKAGE
    # ---------------------------------------------------

    packages = [
        r[3]
        for r in rows
        if r[3] is not None
    ]

    avg_package = round(
        sum(packages) / len(packages),
        2
    ) if packages else 0

    # ---------------------------------------------------
    # HIGHEST PACKAGE
    # ---------------------------------------------------

    highest_package = max(
        packages,
        default=0
    )

    # ---------------------------------------------------
    # BRANCH CHART
    # ---------------------------------------------------

    # Branch chart
    branch_placed_counts = {}
    branch_unplaced_counts = {}

    for row in rows:

        branch_name = row[1]
        is_placed = row[3] is not None

        if is_placed:

            branch_placed_counts[branch_name] = (
                branch_placed_counts.get(branch_name, 0) + 1
        )

        else:

            branch_unplaced_counts[branch_name] = (
                branch_unplaced_counts.get(branch_name, 0) + 1
        )
    # ---------------------------------------------------
    # COMPANY CHART
    # ---------------------------------------------------

    company_counts = {}

    if status == "unplaced":

        company_counts["Unplaced"] = len(rows)

    else:

        for row in rows:

            if row[2] is not None:

                company_name = row[2]

                company_counts[company_name] = (
                    company_counts.get(company_name, 0) + 1
                )

    # ---------------------------------------------------
    # YEAR CHART
    # ---------------------------------------------------

    year_counts = {}

    for row in rows:

        is_placed = row[3] is not None

        if status == "unplaced":
            should_count = not is_placed
        else:
            should_count = is_placed

        if should_count:

            yr = str(row[4])

            year_counts[yr] = (
                year_counts.get(yr, 0) + 1
            )

    # ---------------------------------------------------
    # PACKAGE DISTRIBUTION
    # ---------------------------------------------------

    package_counts = {
        "<5 LPA": 0,
        "5-10 LPA": 0,
        "10-20 LPA": 0,
        "20+ LPA": 0
    }

    for row in rows:

        package = row[3]

        if package is None:
            continue

        if package < 5:
            package_counts["<5 LPA"] += 1

        elif package <= 10:
            package_counts["5-10 LPA"] += 1

        elif package <= 20:
            package_counts["10-20 LPA"] += 1

        else:
            package_counts["20+ LPA"] += 1

    # ---------------------------------------------------
    # RETURN DATA
    # ---------------------------------------------------

    return jsonify({

        "students": rows,

        # IMPORTANT:
        # This is now independent of Status
        "total_students": total_students,

        # This depends on Status
        "placed_students": placed,

        "avg_package": avg_package,

        "highest_package": highest_package,

        "branch_placed_chart": branch_placed_counts,
        "branch_unplaced_chart": branch_unplaced_counts,

        "company_chart": company_counts,

        "year_chart": year_counts,

        "package_chart": package_counts
    })
if __name__ == "__main__":
    app.run(debug=True)