// Branch-wise Placement
function loadBranches() {

    fetch("/api/branches")
    .then(res => res.json())
    .then(data => {

        const select = document.getElementById("branchFilter");

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

        const select = document.getElementById("companyFilter");

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

        const select = document.getElementById("yearFilter");

        data.forEach(year => {

            select.innerHTML += `
                <option value="${year}">
                    ${year}
                </option>
            `;

        });

    });

}
function loadDashboard(branch, year, company, status, search) {

    fetch(`/api/dashboard?branch=${encodeURIComponent(branch)}&year=${encodeURIComponent(year)}&company=${encodeURIComponent(company)}&status=${encodeURIComponent(status)}&search=${encodeURIComponent(search)}`)
    .then(res => res.json())
    .then(data => {

        // KPI Cards
        document.getElementById("totalStudents").innerText = data.total_students;
        document.getElementById("placedStudents").innerText = data.placed_students;
        document.getElementById("avgPackage").innerText = data.avg_package + " LPA";

        const rate = (
            data.placed_students / Math.max(1, data.total_students) * 100
        ).toFixed(2);

        document.getElementById("placementRate").innerText = rate + "%";

        // Student Table
        let table = "";

        data.students.forEach(student => {

            table += `
            <tr>
                <td>${student[0]}</td>
                <td>${student[1]}</td>
                <td>${student[2] ?? "-"}</td>
                <td>${student[3] ?? "-"}</td>
            </tr>
            `;

        });

        document.getElementById("studentTable").innerHTML = table;

        // Branch Chart
        branchChart.data.labels = Object.keys(data.branch_chart);
        branchChart.data.datasets[0].data = Object.values(data.branch_chart);
        branchChart.update();

        // Company Chart
        companyChart.data.labels = Object.keys(data.company_chart);
        companyChart.data.datasets[0].data = Object.values(data.company_chart);
        companyChart.update();

        // Year Chart
        yearChart.data.labels = Object.keys(data.year_chart);
        yearChart.data.datasets[0].data = Object.values(data.year_chart);
        yearChart.update();

        // Package Chart
        packageChart.data.labels = Object.keys(data.package_chart);
        packageChart.data.datasets[0].data = Object.values(data.package_chart);
        packageChart.update();

    });

}
let branchChart;
let companyChart;
let yearChart;
let packageChart;
fetch("/api/branch-placement")
.then(response => response.json())
.then(data => {

    branchChart = new Chart(document.getElementById("branchChart"), {

        type:'bar',

        data:{
            labels:data.labels,

           datasets: [{
    label: "Placed Students",
    data: data.values,
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

    });

});
// Company Hiring
fetch("/api/company-hiring")
.then(response=>response.json())
.then(data=>{

    companyChart = new Chart(document.getElementById("companyChart"), {

        type:'pie',

        data:{
            labels:data.labels,

            datasets:[{
                data:data.values
            }]
        },
          options: {
        responsive: true,
        maintainAspectRatio: false
    }

    });

});

// Year-wise Placement
fetch("/api/year-placement")
.then(res => res.json())
.then(data => {

    yearChart = new Chart(document.getElementById("yearChart"), {

        type: "line",

        data: {
            labels: data.labels,

            datasets: [{
                label: "Placements",
                data: data.values,
                fill: false,
                tension: 0.3
            }]
        },
          options: {
        responsive: true,
        maintainAspectRatio: false
    }

    });

});
// Package Distribution
fetch("/api/package-distribution")
.then(res => res.json())
.then(data => {

    packageChart = new Chart(document.getElementById("packageChart"), {

        type: "bar",

        data: {
            labels: data.labels,

            datasets: [{
                label: "Students",
                data: data.values
            }]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false
        }

    });

});
fetch("/api/students")
.then(res=>res.json())
.then(data=>{

let table="";

data.forEach(student=>{

table+=`

<tr>

<td>${student[0]}</td>

<td>${student[1]}</td>

<td>${student[2]}</td>

<td>${student[3]} LPA</td>

</tr>

`;

});

document.getElementById("studentTable").innerHTML=table;
document.getElementById("applyFilters")
.addEventListener("click", () => {

    const branch = document.getElementById("branchFilter").value;
    const year = document.getElementById("yearFilter").value;
    const company = document.getElementById("companyFilter").value;
    const status = document.getElementById("statusFilter").value;
    const search = document.getElementById("searchBox").value;

    loadDashboard(branch, year, company, status, search);

});
document.getElementById("resetFilters").addEventListener("click", () => {

    document.getElementById("branchFilter").value = "";
    document.getElementById("yearFilter").value = "";
    document.getElementById("companyFilter").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("searchBox").value = "";

    loadDashboard("", "", "", "", "");

});
});
loadBranches();
loadCompanies();
loadYears();
