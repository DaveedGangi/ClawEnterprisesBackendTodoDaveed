const express = require("express");

const path = require("path");

const app=express();
app.use(express.json());

const {open} = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath=path.join(__dirname, "userData.db");

const cors=require("cors");
app.use(cors());

const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

let db;

let intializeDataBaseAndServer=async()=>{
    try{
        db=await open({
            filename:dbPath,
            driver:sqlite3.Database
        });

     
            app.listen(3000,()=>{
                console.log("server is running at http://localhost:3000");
            })
        
        // table for login and register user
        await db.run(`CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT,
            password TEXT

        );`);

        // table for todos
        await db.run(`CREATE TABLE IF NOT EXISTS todos(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            user_id INTEGER,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );`);

        //table for session each user login and logouttime
        await db.run(`CREATE TABLE IF NOT EXISTS sessions(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            login_time TEXT,
            logout_time TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );`);


    }
 
    catch(err){
        console.log(err.message);
        process.exit(1);
    }



}

intializeDataBaseAndServer();

// user register
app.post("/register", async(request,response)=>{

    const {username,password}=request.body;

    const hashedPassword=await bcrypt.hash(password,10);

    const selectUserQuery=`SELECT * FROM users WHERE username='${username}';`;

    const dbUser=await db.get(selectUserQuery);
    if(dbUser===undefined){
        const createUserQuery=`INSERT INTO users(username,password)
        VALUES('${username}','${hashedPassword}');`;
        await db.run(createUserQuery);
        response.status(200);
       
        response.send({errorMessage:"user created successfully"});
    }
    else{
        response.status(400);
     
        response.send({errorMessage:"user already exists"});
    }


});

// user login 

app.post("/login", async (request, response) => {
    const { username, password } = request.body;

   const selectUserQuery = `SELECT * FROM users WHERE username = '${username}';`;
  

    const dbUser = await db.get(selectUserQuery);
    console.log(dbUser);
    if (dbUser === undefined) {
        response.status(400);
        console.log(dbUser);
        response.send({ errorMessage:"Invalid user" });
    } else {
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
        if (isPasswordMatched === true) {
            const payload = {
                username: username,
            };
            const jwtToken = jwt.sign(payload, "MY_SECRET_KEY");
            response.send({ jwtToken: jwtToken,username:username,id:dbUser.id });


        } else {
            response.status(400);
            response.send({errorMessage: "Invalid password"});
        }
    }

  });


app.get("/allUsers/", async (request, response) => {
    const selectQuery = `SELECT * FROM users;`;
        const dbResponse = await db.all(selectQuery);
            response.status(200);
            response.send(dbResponse);

}
);

app.post("/todos",async(request,response)=>{
    const {title,description,user_id}=request.body;
    const createTodoQuery=`INSERT INTO todos(title,description,user_id)
    VALUES('${title}','${description}','${user_id}');`;
    await db.run(createTodoQuery);
    response.status(200);
   
    response.send({errorMessage:"todo created successfully"});
});

app.get("/todos/:id",async(request,response)=>{
    const {id}=request.params;
    const selectTodoQuery=`SELECT * FROM todos WHERE user_id='${id}';`;
    const dbTodo=await db.all(selectTodoQuery);
    response.status(200);
    
    response.send(dbTodo);
});

app.get("/getAllTodos",async(request,response)=>{
    const selectAllTodoQuery=`SELECT * FROM todos;`;
    const dbTodo=await db.all(selectAllTodoQuery);
    response.status(200);

    response.send(dbTodo);
});


app.put("/todos/:id",async(request,response)=>{
    const {id}=request.params;
    const {title,description}=request.body;
    const updateTodoQuery=`UPDATE todos SET title='${title}',description='${description}' WHERE id='${id}';`;
    await db.run(updateTodoQuery);
    response.status(200);
   
    response.send({errorMessage:"todo updated successfully"});
});

app.delete("/todos/:id",async(request,response)=>{
    const {id}=request.params;
    const deleteTodoQuery=`DELETE FROM todos WHERE id='${id}';`;
    await db.run(deleteTodoQuery);
    response.status(200);
    
    response.send({errorMessage:"todo deleted successfully"});
});


app.get("/sessions",async(request,response)=>{
    const alluserSessionsQuery=`SELECT * FROM sessions;`;
    const dbSessions=await db.all(alluserSessionsQuery);
    response.status(200);
    response.send(dbSessions);
    });


// login session timing 
app.post("/loginSession",async(request,response)=>{
    const {user_id,login_time,logout_time}=request.body;
    const createSessionQuery=`INSERT INTO sessions(user_id,login_time,logout_time)
    VALUES('${user_id}','${login_time}','${logout_time}');`;
    await db.run(createSessionQuery);
    response.status(200);

    response.send({errorMessage:"session created successfully"});
});




