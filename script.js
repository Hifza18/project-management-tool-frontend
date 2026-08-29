const API_URL = "https://project-management-tool-backend-r4uz.onrender.com/";

// =====================================================
// USER + TOKEN
// =====================================================

let user = null;
let token = localStorage.getItem("token");

try {
    user = JSON.parse(localStorage.getItem("user"));
} catch (error) {
    console.error("User data error:", error);
    user = null;
}


// =====================================================
// REGISTER
// =====================================================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("message");

        try {

            const response = await fetch(
                `${API_URL}/auth/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                message.textContent =
                    "Registration successful!";

                registerForm.reset();

                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1000);

            } else {

                message.textContent =
                    data.message ||
                    "Registration failed.";
            }

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            message.textContent =
                "Unable to connect to server.";
        }
    });
}


// =====================================================
// LOGIN
// =====================================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const message =
            document.getElementById("message");

        try {

            const response = await fetch(
                `${API_URL}/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (response.ok) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                localStorage.setItem(
                    "token",
                    data.token
                );

                user = data.user;
                token = data.token;

                message.textContent =
                    "Login successful!";

                window.location.href =
                    "dashboard.html";

            } else {

                message.textContent =
                    data.message ||
                    "Login failed.";
            }

        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            message.textContent =
                "Unable to connect to server.";
        }
    });
}


// =====================================================
// DASHBOARD ELEMENTS
// =====================================================

const projectsContainer =
    document.getElementById("projectsContainer");

const userName =
    document.getElementById("userName");

const logoutBtn =
    document.getElementById("logoutBtn");


// =====================================================
// DASHBOARD STATISTICS
// =====================================================

const totalProjectsElement =
    document.getElementById("totalProjects");

const totalTasksElement =
    document.getElementById("totalTasks");

const todoCountElement =
    document.getElementById("todoCount");

const progressCountElement =
    document.getElementById("progressCount");

const completedCountElement =
    document.getElementById("completedCount");


// =====================================================
// DASHBOARD
// =====================================================

if (projectsContainer) {

    if (!user || !token) {

        window.location.href =
            "login.html";

    } else {

        if (userName) {

            userName.textContent =
                `Welcome, ${user.name}`;
        }

        loadProjects();
    }
}


// =====================================================
// LOAD PROJECTS
// =====================================================

async function loadProjects() {

    if (!projectsContainer) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/projects`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (response.status === 401) {

            logoutUser();
            return;
        }

        const data =
            await response.json();

        projectsContainer.innerHTML = "";


        // =================================================
        // UPDATE TOTAL PROJECTS
        // =================================================

        if (totalProjectsElement) {

            totalProjectsElement.textContent =
                data.projects
                    ? data.projects.length
                    : 0;
        }


        // =================================================
        // LOAD TASK STATISTICS
        // =================================================

        if (data.projects) {

            loadDashboardTaskStats(
                data.projects
            );

        } else {

            resetDashboardStats();
        }


        // =================================================
        // NO PROJECTS
        // =================================================

        if (
            !data.projects ||
            data.projects.length === 0
        ) {

            projectsContainer.innerHTML = `
                <p class="empty-message">
                    No projects yet.
                    Create your first project!
                </p>
            `;

            return;
        }


        // =================================================
        // DISPLAY PROJECTS
        // =================================================

        data.projects.forEach(project => {

            const projectCard =
                document.createElement("div");

            projectCard.className =
                "project-card";


            const title =
                document.createElement("h3");

            title.textContent =
                project.name;


            const description =
                document.createElement("p");

            description.textContent =
                project.description ||
                "No description available.";


            const owner =
                document.createElement("small");

            owner.textContent =
                `Owner: ${project.owner_name}`;


            const viewButton =
                document.createElement("button");

            viewButton.className =
                "btn view-project-btn";

            viewButton.type =
                "button";

            viewButton.textContent =
                "View Project";

            viewButton.addEventListener(
                "click",
                () => {

                    openProject(
                        project.id
                    );

                }
            );


            projectCard.appendChild(title);

            projectCard.appendChild(
                description
            );

            projectCard.appendChild(owner);

            projectCard.appendChild(
                document.createElement("br")
            );

            projectCard.appendChild(
                document.createElement("br")
            );

            projectCard.appendChild(
                viewButton
            );


            projectsContainer.appendChild(
                projectCard
            );

        });

    } catch (error) {

        console.error(
            "Load projects error:",
            error
        );

        projectsContainer.innerHTML = `
            <p class="error-message">
                Unable to load projects.
            </p>
        `;

        resetDashboardStats();
    }
}


// =====================================================
// LOAD DASHBOARD TASK STATISTICS
// =====================================================

async function loadDashboardTaskStats(projects) {

    if (!totalTasksElement) {
        return;
    }

    let allTasks = [];


    for (const project of projects) {

        try {

            const response =
                await fetch(
                    `${API_URL}/tasks/project/${project.id}`,
                    {
                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );

            if (response.status === 401) {

                logoutUser();
                return;
            }

            const data =
                await response.json();

            if (data.tasks) {

                allTasks =
                    allTasks.concat(
                        data.tasks
                    );
            }

        } catch (error) {

            console.error(
                `Unable to load tasks for project ${project.id}:`,
                error
            );
        }
    }


    totalTasksElement.textContent =
        allTasks.length;


    if (todoCountElement) {

        todoCountElement.textContent =
            allTasks.filter(
                task =>
                    task.status === "To Do"
            ).length;
    }


    if (progressCountElement) {

        progressCountElement.textContent =
            allTasks.filter(
                task =>
                    task.status === "In Progress"
            ).length;
    }


    if (completedCountElement) {

        completedCountElement.textContent =
            allTasks.filter(
                task =>
                    task.status === "Completed"
            ).length;
    }
}


// =====================================================
// RESET DASHBOARD STATISTICS
// =====================================================

function resetDashboardStats() {

    if (totalProjectsElement) {
        totalProjectsElement.textContent = "0";
    }

    if (totalTasksElement) {
        totalTasksElement.textContent = "0";
    }

    if (todoCountElement) {
        todoCountElement.textContent = "0";
    }

    if (progressCountElement) {
        progressCountElement.textContent = "0";
    }

    if (completedCountElement) {
        completedCountElement.textContent = "0";
    }
}


// =====================================================
// CREATE PROJECT MODAL
// =====================================================

const projectModal =
    document.getElementById("projectModal");

const createProjectBtn =
    document.getElementById(
        "createProjectBtn"
    );

const closeModal =
    document.getElementById(
        "closeModal"
    );

const projectForm =
    document.getElementById(
        "projectForm"
    );


if (
    createProjectBtn &&
    projectModal
) {

    createProjectBtn.addEventListener(
        "click",
        () => {

            projectModal.style.display =
                "flex";

        }
    );
}


if (
    closeModal &&
    projectModal
) {

    closeModal.addEventListener(
        "click",
        () => {

            projectModal.style.display =
                "none";

        }
    );
}


if (projectModal) {

    window.addEventListener(
        "click",
        (e) => {

            if (e.target === projectModal) {

                projectModal.style.display =
                    "none";
            }
        }
    );
}


// =====================================================
// CREATE PROJECT
// =====================================================

if (projectForm) {

    projectForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            if (!user || !token) {

                window.location.href =
                    "login.html";

                return;
            }

            const name =
                document.getElementById(
                    "projectName"
                ).value.trim();

            const description =
                document.getElementById(
                    "projectDescription"
                ).value.trim();

            const projectMessage =
                document.getElementById(
                    "projectMessage"
                );

            try {

                const response =
                    await fetch(
                        `${API_URL}/projects`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({
                                name,
                                description
                            })
                        }
                    );

                if (response.status === 401) {

                    logoutUser();
                    return;
                }

                const data =
                    await response.json();

                if (response.ok) {

                    projectMessage.textContent =
                        "Project created successfully!";

                    projectForm.reset();

                    setTimeout(() => {

                        projectModal.style.display =
                            "none";

                        projectMessage.textContent =
                            "";

                        loadProjects();

                    }, 700);

                } else {

                    projectMessage.textContent =
                        data.message ||
                        "Unable to create project.";
                }

            } catch (error) {

                console.error(
                    "Create project error:",
                    error
                );

                projectMessage.textContent =
                    "Unable to connect to server.";
            }
        }
    );
}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            logoutUser();

        }
    );
}


// =====================================================
// LOGOUT FUNCTION
// =====================================================

function logoutUser() {

    localStorage.removeItem("user");

    localStorage.removeItem("token");

    localStorage.removeItem("selectedProject");

    user = null;
    token = null;

    window.location.href =
        "login.html";
}


// =====================================================
// OPEN PROJECT
// =====================================================

function openProject(projectId) {

    localStorage.setItem(
        "selectedProject",
        projectId
    );

    window.location.href =
        "project.html";
}


// =====================================================
// PROJECT PAGE ELEMENTS
// =====================================================

const todoTasks =
    document.getElementById(
        "todoTasks"
    );

const progressTasks =
    document.getElementById(
        "progressTasks"
    );

const completedTasks =
    document.getElementById(
        "completedTasks"
    );

const projectTitle =
    document.getElementById(
        "projectTitle"
    );

const projectDescription =
    document.getElementById(
        "projectDescription"
    );

const createTaskBtn =
    document.getElementById(
        "createTaskBtn"
    );

const taskModal =
    document.getElementById(
        "taskModal"
    );

const closeTaskModal =
    document.getElementById(
        "closeTaskModal"
    );

const taskForm =
    document.getElementById(
        "taskForm"
    );

const selectedProjectId =
    localStorage.getItem(
        "selectedProject"
    );


// =====================================================
// LOAD PROJECT PAGE
// =====================================================

if (
    todoTasks &&
    selectedProjectId
) {

    if (!user || !token) {

        window.location.href =
            "login.html";

    } else {

        loadProjectDetails();
        loadTasks();
    }
}


// =====================================================
// LOAD PROJECT DETAILS
// =====================================================

async function loadProjectDetails() {

    if (!projectTitle) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/projects`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (response.status === 401) {

            logoutUser();
            return;
        }

        const data =
            await response.json();

        const project =
            data.projects.find(
                p =>
                    String(p.id) ===
                    String(
                        selectedProjectId
                    )
            );

        if (!project) {

            projectTitle.textContent =
                "Project not found";

            if (projectDescription) {

                projectDescription.textContent =
                    "";
            }

            return;
        }

        projectTitle.textContent =
            project.name;

        if (projectDescription) {

            projectDescription.textContent =
                project.description ||
                "No description";
        }

    } catch (error) {

        console.error(
            "Project details error:",
            error
        );

        projectTitle.textContent =
            "Unable to load project";
    }
}


// =====================================================
// LOAD TASKS
// =====================================================

async function loadTasks() {

    if (
        !todoTasks ||
        !progressTasks ||
        !completedTasks
    ) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/tasks/project/${selectedProjectId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        if (response.status === 401) {

            logoutUser();
            return;
        }

        const data =
            await response.json();

        todoTasks.innerHTML = "";
        progressTasks.innerHTML = "";
        completedTasks.innerHTML = "";


        if (
            !data.tasks ||
            data.tasks.length === 0
        ) {

            todoTasks.innerHTML = `
                <p class="empty-message">
                    No tasks yet.
                </p>
            `;

            return;
        }


        data.tasks.forEach(task => {

            const taskCard =
                createTaskCard(task);


            if (
                task.status === "To Do"
            ) {

                todoTasks.appendChild(
                    taskCard
                );

            } else if (
                task.status === "In Progress"
            ) {

                progressTasks.appendChild(
                    taskCard
                );

            } else if (
                task.status === "Completed"
            ) {

                completedTasks.appendChild(
                    taskCard
                );

            } else {

                todoTasks.appendChild(
                    taskCard
                );
            }

        });

    } catch (error) {

        console.error(
            "Load tasks error:",
            error
        );

        todoTasks.innerHTML = `
            <p class="error-message">
                Unable to load tasks.
            </p>
        `;
    }
}


// =====================================================
// CREATE TASK CARD
// =====================================================

function createTaskCard(task) {

    const card =
        document.createElement("div");

    card.className =
        "task-card";


    const title =
        document.createElement("h3");

    title.textContent =
        task.title;


    const description =
        document.createElement("p");

    description.textContent =
        task.description ||
        "No description";


    const priority =
        document.createElement("span");

    priority.className =
        "priority";

    priority.textContent =
        `Priority: ${task.priority}`;


    const assignedUser =
        document.createElement("span");

    assignedUser.className =
        "assigned-user";

    assignedUser.textContent =
        `Assigned to: ${
            task.assigned_user ||
            "Unassigned"
        }`;


    const dueDate =
        document.createElement("span");

    dueDate.className =
        "due-date";

    if (task.due_date) {

        dueDate.textContent =
            `Due Date: ${task.due_date}`;

    } else {

        dueDate.textContent =
            "Due Date: Not set";
    }


    // =================================================
    // STATUS
    // =================================================

    const statusSelect =
        document.createElement("select");

    statusSelect.className =
        "task-status";

    const statuses = [
        "To Do",
        "In Progress",
        "Completed"
    ];


    statuses.forEach(status => {

        const option =
            document.createElement("option");

        option.value =
            status;

        option.textContent =
            status;

        if (
            task.status === status
        ) {

            option.selected =
                true;
        }

        statusSelect.appendChild(
            option
        );
    });


    statusSelect.addEventListener(
        "change",
        () => {

            updateTaskStatus(
                task.id,
                statusSelect.value
            );
        }
    );


    // =================================================
    // COMMENTS BUTTON
    // =================================================

    const commentButton =
        document.createElement("button");

    commentButton.className =
        "comment-btn";

    commentButton.type =
        "button";

    commentButton.textContent =
        "💬 Comments";

    commentButton.addEventListener(
        "click",
        () => {

            viewComments(
                task.id
            );
        }
    );


    // =================================================
    // EDIT BUTTON
    // =================================================

    const editButton =
        document.createElement("button");

    editButton.className =
        "edit-task-btn";

    editButton.type =
        "button";

    editButton.textContent =
        "✏️ Edit";

    editButton.addEventListener(
        "click",
        () => {

            editTask(task);
        }
    );


    // =================================================
    // DELETE BUTTON
    // =================================================

    const deleteButton =
        document.createElement("button");

    deleteButton.className =
        "delete-task-btn";

    deleteButton.type =
        "button";

    deleteButton.textContent =
        "🗑️ Delete";


    deleteButton.addEventListener(
        "click",
        async () => {

            const confirmDelete =
                confirm(
                    `Are you sure you want to delete "${task.title}"?`
                );

            if (!confirmDelete) {
                return;
            }


            try {

                const response =
                    await fetch(
                        `${API_URL}/tasks/${task.id}`,
                        {
                            method: "DELETE",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );

                if (response.status === 401) {

                    logoutUser();
                    return;
                }

                const data =
                    await response.json();


                if (response.ok) {

                    alert(
                        "Task deleted successfully!"
                    );

                    await loadTasks();

                } else {

                    alert(
                        data.message ||
                        "Unable to delete task."
                    );
                }

            } catch (error) {

                console.error(
                    "Delete task error:",
                    error
                );

                alert(
                    "Unable to connect to server."
                );
            }
        }
    );


    // =================================================
    // ADD ELEMENTS
    // =================================================

    card.appendChild(title);

    card.appendChild(description);

    card.appendChild(priority);

    card.appendChild(assignedUser);

    card.appendChild(dueDate);

    card.appendChild(
        document.createElement("br")
    );

    card.appendChild(statusSelect);

    card.appendChild(
        document.createElement("br")
    );

    card.appendChild(editButton);

    card.appendChild(commentButton);

    card.appendChild(deleteButton);


    return card;
}


// =====================================================
// CREATE TASK MODAL
// =====================================================

if (
    createTaskBtn &&
    taskModal
) {

    createTaskBtn.addEventListener(
        "click",
        () => {

            taskModal.style.display =
                "flex";
        }
    );
}


if (
    closeTaskModal &&
    taskModal
) {

    closeTaskModal.addEventListener(
        "click",
        () => {

            taskModal.style.display =
                "none";
        }
    );
}


if (taskModal) {

    window.addEventListener(
        "click",
        (e) => {

            if (e.target === taskModal) {

                taskModal.style.display =
                    "none";
            }
        }
    );
}


// =====================================================
// CREATE TASK
// =====================================================

if (taskForm) {

    taskForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            if (!user || !token) {

                window.location.href =
                    "login.html";

                return;
            }


            const title =
                document.getElementById(
                    "taskTitle"
                ).value.trim();

            const description =
                document.getElementById(
                    "taskDescription"
                ).value.trim();

            const priority =
                document.getElementById(
                    "taskPriority"
                ).value;

            const dueDate =
                document.getElementById(
                    "taskDueDate"
                ).value;

            const taskMessage =
                document.getElementById(
                    "taskMessage"
                );


            try {

                const response =
                    await fetch(
                        `${API_URL}/tasks`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body: JSON.stringify({

                                project_id:
                                    Number(
                                        selectedProjectId
                                    ),

                                title,

                                description,

                                status:
                                    "To Do",

                                priority,

                                due_date:
                                    dueDate ||
                                    null
                            })
                        }
                    );


                if (response.status === 401) {

                    logoutUser();
                    return;
                }


                const data =
                    await response.json();


                if (response.ok) {

                    taskMessage.textContent =
                        "Task created successfully!";

                    taskForm.reset();


                    setTimeout(
                        async () => {

                            taskModal.style.display =
                                "none";

                            taskMessage.textContent =
                                "";

                            await loadTasks();

                        },
                        700
                    );

                } else {

                    taskMessage.textContent =
                        data.message ||
                        "Unable to create task.";
                }

            } catch (error) {

                console.error(
                    "Create task error:",
                    error
                );

                taskMessage.textContent =
                    "Unable to connect to server.";
            }
        }
    );
}


// =====================================================
// UPDATE TASK STATUS
// =====================================================

async function updateTaskStatus(
    taskId,
    newStatus
) {

    try {

        const response =
            await fetch(
                `${API_URL}/tasks/${taskId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        status:
                            newStatus
                    })
                }
            );


        if (response.status === 401) {

            logoutUser();
            return;
        }


        const data =
            await response.json();


        if (response.ok) {

            await loadTasks();

        } else {

            alert(
                data.message ||
                "Unable to update task."
            );
        }

    } catch (error) {

        console.error(
            "Update task error:",
            error
        );

        alert(
            "Unable to update task."
        );
    }
}


// =====================================================
// EDIT TASK
// =====================================================

async function editTask(task) {

    const newTitle =
        prompt(
            "Enter new task title:",
            task.title
        );

    if (newTitle === null) {
        return;
    }


    if (newTitle.trim() === "") {

        alert(
            "Task title cannot be empty."
        );

        return;
    }


    const newDescription =
        prompt(
            "Enter new description:",
            task.description || ""
        );

    if (newDescription === null) {
        return;
    }


    const newPriority =
        prompt(
            "Enter priority (Low / Medium / High):",
            task.priority
        );

    if (newPriority === null) {
        return;
    }


    const priority =
        newPriority.trim();


    if (
        priority !== "Low" &&
        priority !== "Medium" &&
        priority !== "High"
    ) {

        alert(
            "Priority must be Low, Medium, or High."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/tasks/${task.id}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        title:
                            newTitle.trim(),

                        description:
                            newDescription.trim(),

                        priority:
                            priority
                    })
                }
            );


        if (response.status === 401) {

            logoutUser();
            return;
        }


        const data =
            await response.json();


        if (response.ok) {

            alert(
                "Task updated successfully!"
            );

            await loadTasks();

        } else {

            alert(
                data.message ||
                "Unable to update task."
            );
        }

    } catch (error) {

        console.error(
            "Edit task error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


// =====================================================
// VIEW + ADD COMMENTS
// =====================================================

async function viewComments(taskId) {

    try {

        const token =
            localStorage.getItem("token");


        if (!token) {

            alert(
                "Please login first."
            );

            window.location.href =
                "login.html";

            return;
        }


        // =================================================
        // GET COMMENTS
        // =================================================

        const response =
            await fetch(
                `${API_URL}/comments/task/${taskId}`,
                {
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        if (response.status === 401) {

            logoutUser();
            return;
        }


        const data =
            await response.json();


        let commentText =
            "Comments:\n\n";


        if (
            !data.comments ||
            data.comments.length === 0
        ) {

            commentText =
                "No comments yet.\n\n";

        } else {

            data.comments.forEach(
                comment => {

                    commentText +=
                        `${comment.user_name}: ${comment.comment}\n\n`;
                }
            );
        }


        const newComment =
            prompt(
                commentText +
                "--------------------\n" +
                "Enter a new comment:"
            );


        if (newComment === null) {
            return;
        }


        if (
            newComment.trim() === ""
        ) {

            alert(
                "Comment cannot be empty."
            );

            return;
        }


        // =================================================
        // ADD COMMENT
        // =================================================

        const commentResponse =
            await fetch(
                `${API_URL}/comments`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: JSON.stringify({

                        task_id:
                            Number(taskId),

                        comment:
                            newComment.trim()
                    })
                }
            );


        if (commentResponse.status === 401) {

            logoutUser();
            return;
        }


        const commentData =
            await commentResponse.json();


        if (commentResponse.ok) {

            alert(
                "Comment added successfully!"
            );

        } else {

            alert(
                commentData.message ||
                "Unable to add comment."
            );
        }

    } catch (error) {

        console.error(
            "Comments error:",
            error
        );

        alert(
            "Unable to connect to server."
        );
    }
}


// =====================================================
// GLOBAL FUNCTIONS
// =====================================================

window.openProject =
    openProject;

window.updateTaskStatus =
    updateTaskStatus;

window.viewComments =
    viewComments;

window.editTask =
    editTask;

