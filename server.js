/************************************************************************* 
* WEB322– Assignment 5
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. 
* No part of this assignment has been copied manually or electronically from any other source. 
* (including 3rd party web sites) or distributed to other students. * 

* Name: Melika Hamedani Student ID: 175474212  Date: 2022-11-27

* Your app’s URL (from Cyclic) that I can click to see your application:

https://cute-puce-rabbit-belt.cyclic.app
* *************************************************************************/
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const app = express()
const handleBars = require('express-handlebars')
const dataService = require('./data-service')
const port = process.env.PORT || 8080;


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/images/uploaded')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({ storage: storage })

//use
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(function (req, res, next) {
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

//express handlebars
app.engine('.hbs', handleBars.engine({
    extname: '.hbs', helpers: {
        navLink: function (url, options) {
            if (url == app.locals.activeRoute) {
                return `<a href="${url}" class="link active">${options.fn(this)}</a>`
            } else {
                return `<a href="${url}" class="link">${options.fn(this)}</a>`
            }
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }

    }
}));
app.set('view engine', '.hbs');


//home
app.get('/', (req, res) => {
    res.render('home')
})

//about
app.get('/about', (req, res) => {
    res.render('about')
})

//employee
app.get('/employees', (req, res) => {
    if (req.query.status) {
        dataService.getEmployeesByStatus(req.query.status)
            .then((data) => {
                if (data.length > 0) {
                    res.render('employees', { employees: data })
                } else {
                    res.render('employees', { message: "no results" });
                }
            })
            .catch(err => console.log(err))
    }
    if (req.query.manager) {
        dataService.getEmployeesByManager(req.query.manager)
            .then((data) => {
                if (data.length > 0) {
                    res.render('employees', { employees: data })
                } else {
                    res.render('employees', { message: "no results" });
                }
            })
            .catch(err => console.log(err))
    }
    if (req.query.department) {
        dataService.getEmployeesByDepartment(req.query.department)
            .then((data) => {
                if (data.length > 0) {
                    res.render('employees', { employees: data })
                } else {
                    res.render('employees', { message: "no results" });
                }
            })
            .catch(err => console.log(err))
    }
    dataService.getAllEmployees()
        .then(data => {
            if (data.length > 0) {
                res.render('employees', { employees: data })
            } else {
                res.render('employees', { message: "no results" });
            }
        })
        .catch(err => console.log(err))

})

//employee by num
app.get("/employee/:empNum", (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};
    dataService.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
            viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
        viewData.employee = null; // set employee to null if there was an error
    }).then(dataService.getDepartments)
        .then((data) => {
            viewData.departments = data; // store department data in the "viewData" object as "departments"
            // loop through viewData.departments and once we have found the departmentId that matches
            // the employee's "department" value, add a "selected" property to the matching
            // viewData.departments object
            for (let i = 0; i < viewData.departments.length; i++) {
                if (viewData.departments[i].departmentId == viewData.employee.department) {
                    viewData.departments[i].selected = true;
                }
            }
        }).catch(() => {
            viewData.departments = []; // set departments to empty if there was an error
        }).then(() => {
            if (viewData.employee == null) { // if no employee - return an error
                res.status(404).send("Employee Not Found");
            } else {
                res.render("employee", { viewData: viewData }); // render the "employee" view
            }
        });
});

//add employee
app.get('/employees/add', (req, res) => {
    dataService.getDepartments().then(data => {
        res.render('addEmployee', { departments: data });
    }).catch(err => res.render('addEmployee', { departments: [] }))
});

app.post('/employees/add', (req, res) => {
    dataService.addEmployee(req.body).then(() => {
        res.redirect('/employees');
    }).catch(err => console.log(err))
});

//update employee
app.post('/employee/update', (req, res) => {
    dataService.updateEmployee(req.body).then(res.redirect('/employees'))
});

//image
app.get('/images/add', (req, res) => {
    res.render('addImage')
})
app.post('/images/add', upload.single('imageFile'), (req, res) => {
    res.redirect('/images')
})
app.get('/images', (req, res) => {
    fs.readdir('./public/images/uploaded', function (err, items) {
        if (err) return res.render('images', { message: err })
        res.render('images', { data: items })
    })
})

//department
app.get('/departments', (req, res) => {
    dataService.getDepartments()
        .then(data => {
            if (data.length > 0) {
                res.render('departments', { departments: data })
            } else {
                res.render('departments', { message: "no results" })
            }
        })
        .catch(err => console.log(err))
});


//add department
app.get('/departments/add', (req, res) => {
    res.render('addDepartment')
});
app.post('/departments/add', (req, res) => {
    dataService.addDepartment(req.body).then(() => {
        res.redirect('/departments')
    })
});

//update department
app.post('/department/update', (req, res) => {
    dataService.updateDepartment(req.body).then(() => {
        res.redirect('/departments')
    })
});

//get department by ID
app.get('/department/:departmentId', (req, res) => {
    dataService.getDepartmentById(req.params.departmentId).then(data => {
        if (data == undefined) {
            res.status(404).send("Department Not Found")
        } else {
            res.render('department', { department: data })
        }
    }).catch(err => res.status(404).send("Department Not Found"))
});

//delete employee
app.get('/employees/delete/:empNum', (req, res) => {
    dataService.deleteEmployeeByNum(req.params.empNum).then(() => {
        res.redirect('/employees')
    }).catch(err => res.status(500).send('Unable to Remove Employee'))
});

// 404 not found
app.get("*", (req, res) => {
    res.status(404).send("Page Not Found");
});


// starting the server
dataService.initialize()
    .then(
        app.listen(port, () => {
            console.log(`Express http server listening on ${port}`)
        })
    )
    .catch(err => console.log(err));
