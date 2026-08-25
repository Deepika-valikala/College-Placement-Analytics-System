// =====================================================
// GLOBAL VARIABLES
// =====================================================

let branchChart;
let companyChart;
let yearChart;
let packageChart;

let currentPage = 1;
const rowsPerPage = 10;
let currentStudents = [];


// =====================================================
// LOAD FILTER OPTIONS
// =====================================================

function loadBranches() {

    fetch("/api/branches")
        .then(res => res.json())
        .then(data => {

            const select =
                document.getElementById("branchFilter");

            data.forEach(branch => {

                select.innerHTML += `
                    <option value="${branch}">
                        ${branch}
                    </option>
                `;

            });

        });

}


function loadCompanies() {

    fetch("/api/companies")
        .then(res => res.json())
        .then(data => {

            const select =
                document.getElementById("companyFilter");

            data.forEach(company => {

                select.innerHTML += `
                    <option value="${company}">
                        ${company}
                    </option>
                `;

            });

        });

}


function loadYears() {

    fetch("/api/years")
        .then(res => res.json())
        .then(data => {

            const select =
                document.getElementById("yearFilter");

            data.forEach(year => {

                select.innerHTML += `
                    <option value="${year}">
                        ${year}
                    </option>
                `;

            });

        });

}


// =====================================================
// RENDER STUDENT TABLE WITH PAGINATION
// =====================================================

function renderStudentTable() {

    const tableBody =
        document.getElementById("studentTable");

    const pageInfo =
        document.getElementById("pageInfo");

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                currentStudents.length / rowsPerPage
            )
        );


    if (currentPage > totalPages) {
        currentPage = totalPages;
    }


    const start =
        (currentPage - 1) * rowsPerPage;

    const end =
        start + rowsPerPage;


    const pageStudents =
        currentStudents.slice(start, end);


    let table = "";


    // No students
    if (currentStudents.length === 0) {

        table = `
            <tr>
                <td
                    colspan="5"
                    class="text-center text-muted py-4">

                    <i class="bi bi-search fs-3"></i>

                    <br>

                    No students found matching your filters.

                </td>
            </tr>
        `;

    }

    // Students found
    else {

        pageStudents.forEach(student => {

            table += `
                <tr>

                    <td>
                        ${student[0]}
                    </td>

                    <td>
                        ${student[1]}
                    </td>

                    <td>
                        ${student[2] ?? "-"}
                    </td>

                    <td>
                        ${
                            student[3] != null
                            ? Number(student[3]).toFixed(2) + " LPA"
                            : "-"
                        }
                    </td>

                    <td>
                        ${student[4] ?? "-"}
                    </td>

                </tr>
            `;

        });

    }


    tableBody.innerHTML = table;


    pageInfo.innerText =
        `Page ${currentPage} of ${totalPages}`;


    document.getElementById("prevPage").disabled =
        currentPage === 1;


    document.getElementById("nextPage").disabled =
        currentPage === totalPages;

}


// =====================================================
// LOAD DASHBOARD
// =====================================================

function loadDashboard(
    branch,
    year,
    company,
    status,
    search,
    sortPackage = ""
) {

    fetch(
        `/api/dashboard?` +
        `branch=${encodeURIComponent(branch)}` +
        `&year=${encodeURIComponent(year)}` +
        `&company=${encodeURIComponent(company)}` +
        `&status=${encodeURIComponent(status)}` +
        `&search=${encodeURIComponent(search)}`
    )

        .then(res => res.json())

        .then(data => {


            // =================================================
            // KPI CARDS
            // =================================================

            document.getElementById("totalStudents").innerText =
                data.total_students;


            document.getElementById("avgPackage").innerText =
                data.avg_package + " LPA";


            document.getElementById("highestPackage").innerText =
                Number(data.highest_package).toFixed(2) +
                " LPA";


            // =================================================
            // STATUS KPI
            // =================================================

            const statusLabel =
                document.getElementById(
                    "statusStudentsLabel"
                );

            const rateLabel =
                document.getElementById(
                    "statusRateLabel"
                );


            if (status === "unplaced") {

                const unplacedStudents =
                    data.students.length;


                statusLabel.innerText =
                    "Unplaced Students";


                document.getElementById(
                    "placedStudents"
                ).innerText =
                    unplacedStudents;


                const unplacedRate =
                    (
                        unplacedStudents /
                        Math.max(
                            1,
                            data.total_students
                        ) *
                        100
                    ).toFixed(2);


                rateLabel.innerText =
                    "Unplaced Rate";


                document.getElementById(
                    "placementRate"
                ).innerText =
                    unplacedRate + "%";

            }

            else {

                statusLabel.innerText =
                    "Placed Students";


                document.getElementById(
                    "placedStudents"
                ).innerText =
                    data.placed_students;


                const rate =
                    (
                        data.placed_students /
                        Math.max(
                            1,
                            data.total_students
                        ) *
                        100
                    ).toFixed(2);


                rateLabel.innerText =
                    "Placement Rate";


                document.getElementById(
                    "placementRate"
                ).innerText =
                    rate + "%";

            }


            // =================================================
            // SORT STUDENTS
            // =================================================

            let students =
                [...data.students];


            if (sortPackage === "high") {

                students.sort((a, b) => {

                    return (
                        (b[3] ?? -1) -
                        (a[3] ?? -1)
                    );

                });

            }


            if (sortPackage === "low") {

                students.sort((a, b) => {

                    return (
                        (a[3] ?? Infinity) -
                        (b[3] ?? Infinity)
                    );

                });

            }


            // Save filtered/sorted students
            currentStudents = students;

            // Always start from page 1
            currentPage = 1;

            // Render only current page
            renderStudentTable();


           // =================================================
// BRANCH CHART
// =================================================

if (status === "") {

    const branches = [
        ...new Set([
            ...Object.keys(data.branch_placed_chart),
            ...Object.keys(data.branch_unplaced_chart)
        ])
    ];

    branchChart.data.labels = branches;

    branchChart.data.datasets = [
        {
            label: "Placed Students",
            data: branches.map(
                branch =>
                    data.branch_placed_chart[branch] ?? 0
            ),
            backgroundColor: "#198754",
            borderRadius: 6
        },
        {
            label: "Unplaced Students",
            data: branches.map(
                branch =>
                    data.branch_unplaced_chart[branch] ?? 0
            ),
            backgroundColor: "#dc3545",
            borderRadius: 6
        }
    ];

} else {

    branchChart.data.labels =
        Object.keys(data.branch_chart);

    branchChart.data.datasets = [
        {
            label:
                status === "unplaced"
                    ? "Unplaced Students"
                    : "Placed Students",

            data:
                Object.values(data.branch_chart),

            backgroundColor:
                status === "unplaced"
                    ? "#dc3545"
                    : "#198754",

            borderRadius: 6
        }
    ];
}

branchChart.update();


            // =================================================
            // COMPANY CHART
            // =================================================

            companyChart.data.labels =
                Object.keys(data.company_chart);


            companyChart.data.datasets[0].data =
                Object.values(data.company_chart);


            companyChart.update();


            // =================================================
            // YEAR CHART
            // =================================================

            yearChart.data.labels =
                Object.keys(data.year_chart);


            yearChart.data.datasets[0].data =
                Object.values(data.year_chart);


            yearChart.update();


            // =================================================
            // PACKAGE CHART
            // =================================================

            packageChart.data.labels =
                Object.keys(data.package_chart);


            packageChart.data.datasets[0].data =
                Object.values(data.package_chart);


            packageChart.update();

        })

        .catch(error => {

            console.error(
                "Dashboard error:",
                error
            );

        });

}


// =====================================================
// INITIAL CHARTS
// =====================================================


// Branch Chart

fetch("/api/branch-placement")

    .then(response => response.json())

    .then(data => {

        branchChart =
            new Chart(
                document.getElementById("branchChart"),
                {

                    type: "bar",

                    data: {

                        labels: data.labels,

                        datasets: [{

                            label:
                                "Placed Students",

                            data:
                                data.values,

                            backgroundColor: [
                                "#0d6efd",
                                "#198754",
                                "#ffc107",
                                "#dc3545"
                            ],

                            borderRadius: 8

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false

                    }

                }
            );

    });


// Company Chart

fetch("/api/company-hiring")

    .then(response => response.json())

    .then(data => {

        companyChart =
            new Chart(
                document.getElementById("companyChart"),
                {

                    type: "pie",

                    data: {

                        labels: data.labels,

                        datasets: [{

                            data: data.values

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false

                    }

                }
            );

    });


// Year Chart

fetch("/api/year-placement")

    .then(res => res.json())

    .then(data => {

        yearChart =
            new Chart(
                document.getElementById("yearChart"),
                {

                    type: "line",

                    data: {

                        labels: data.labels,

                        datasets: [{

                            label:
                                "Placements",

                            data:
                                data.values,

                            fill: false,

                            tension: 0.3

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false

                    }

                }
            );

    });


// Package Chart

fetch("/api/package-distribution")

    .then(res => res.json())

    .then(data => {

        packageChart =
            new Chart(
                document.getElementById("packageChart"),
                {

                    type: "bar",

                    data: {

                        labels: data.labels,

                        datasets: [{

                            label:
                                "Students",

                            data:
                                data.values

                        }]

                    },

                    options: {

                        responsive: true,

                        maintainAspectRatio: false

                    }

                }
            );

    });


// =====================================================
// APPLY FILTERS
// =====================================================

document.getElementById("applyFilters")
    .addEventListener("click", () => {


        const branch =
            document.getElementById(
                "branchFilter"
            ).value;


        const year =
            document.getElementById(
                "yearFilter"
            ).value;


        const company =
            document.getElementById(
                "companyFilter"
            ).value;


        const status =
            document.getElementById(
                "statusFilter"
            ).value;


        const search =
            document.getElementById(
                "searchBox"
            ).value;


        const sortPackage =
            document.getElementById(
                "sortPackage"
            ).value;


        loadDashboard(
            branch,
            year,
            company,
            status,
            search,
            sortPackage
        );

    });


// =====================================================
// RESET FILTERS
// =====================================================

document.getElementById("resetFilters")
    .addEventListener("click", () => {


        document.getElementById(
            "branchFilter"
        ).value = "";


        document.getElementById(
            "yearFilter"
        ).value = "";


        document.getElementById(
            "companyFilter"
        ).value = "";


        document.getElementById(
            "statusFilter"
        ).value = "";


        document.getElementById(
            "searchBox"
        ).value = "";


        document.getElementById(
            "sortPackage"
        ).value = "";


        loadDashboard(
            "",
            "",
            "",
            "",
            "",
            ""
        );

    });


// =====================================================
// PAGINATION
// =====================================================

document.getElementById("prevPage")
    .addEventListener("click", () => {


        if (currentPage > 1) {

            currentPage--;

            renderStudentTable();

        }

    });


document.getElementById("nextPage")
    .addEventListener("click", () => {


        const totalPages =
            Math.ceil(
                currentStudents.length /
                rowsPerPage
            );


        if (currentPage < totalPages) {

            currentPage++;

            renderStudentTable();

        }

    });


// =====================================================
// INITIALIZE FILTERS
// =====================================================

loadBranches();
loadCompanies();
loadYears();


// =====================================================
// INITIAL DASHBOARD LOAD
// =====================================================

loadDashboard(
    "",
    "",
    "",
    "",
    "",
    ""
);