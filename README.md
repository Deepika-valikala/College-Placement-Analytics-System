# 🎓 College Placement Analytics System

A full-stack web application for analyzing and visualizing college placement data using Flask, PostgreSQL, JavaScript, Chart.js, and Pandas.

The system provides an interactive dashboard where placement data can be filtered, searched, analyzed, and visualized through KPIs, charts, and student records.

---

## 🚀 Features

### 📊 Interactive Dashboard
- Total students
- Placed students
- Placement rate
- Average package
- Highest package

### 🔎 Dynamic Filtering
Filter placement data by:
- Branch
- Graduation year
- Company
- Placement status
- Student name

### 📈 Data Visualization
Interactive Chart.js visualizations for:
- Branch-wise placements
- Company-wise hiring
- Year-wise placements
- Package distribution
- Placed vs. unplaced students

### 👨‍🎓 Student Records
- Search student records
- View branch, company, package, and graduation year
- Sort students by package
- Pagination
- No-results handling

### 📑 Excel Analytics
The project includes a Pandas-based analytics script that exports placement analysis to Excel.

Generated analysis includes:
- Raw placement data
- Branch analysis
- Company analysis
- Year analysis
- Package analysis

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- Bootstrap 5
- JavaScript
- Chart.js

### Backend
- Python
- Flask
- REST APIs

### Database
- PostgreSQL
- SQL

### Data Analytics
- Pandas
- OpenPyXL

---

## 🏗️ Project Structure

```text
College-Placement-Analytics-System/
│
├── analytics/
│   └── export_excel.py
│
├── static/
│   ├── script.js
│   └── style.css
│
├── templates/
│   └── index.html
│
├── app.py
├── requirements.txt
├── .gitignore
└── README.md
