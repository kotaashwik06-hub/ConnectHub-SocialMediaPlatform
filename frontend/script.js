
// =====================================
// STEP 1: CHECK LOGIN STATUS
// =====================================

const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

if (!token || !user) {
    window.location.href = "login.html";
}

// =====================================
// STEP 2: GET HTML ELEMENTS
// =====================================

const postInput = document.getElementById("postInput");
const postButton = document.getElementById("postButton");
const postFeed = document.getElementById("postFeed");
const searchInput = document.getElementById("searchInput");

const userSearchInput = document.getElementById("userSearchInput");
const userSearchResults = document.getElementById("userSearchResults");

const imageInput = document.getElementById("imageInput");
const imagePreview = document.getElementById("imagePreview");

let selectedImage = "";

// =====================================
// STEP 3: DISPLAY USER DETAILS
// =====================================

const welcomeUser = document.getElementById("welcomeUser");

if (user && welcomeUser) {
    welcomeUser.textContent = "Welcome, " + user.username;
}

// =====================================
// STEP 4: LOGOUT
// =====================================

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", function () {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        alert("Logged out successfully!");
        window.location.href = "login.html";
    });
}

// =====================================
// STEP 5: IMAGE PREVIEW
// =====================================

if (imageInput && imagePreview) {
    imageInput.addEventListener("change", function () {
        const file = imageInput.files[0];

        selectedImage = "";
        imagePreview.src = "";
        imagePreview.style.display = "none";

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Please select a valid image!");
            imageInput.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert("Image size must be less than 5 MB!");
            imageInput.value = "";
            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {
            selectedImage = event.target.result;
            imagePreview.src = selectedImage;
            imagePreview.style.display = "block";
        };

        reader.onerror = function () {
            alert("Unable to read the selected image!");
            imageInput.value = "";
        };

        reader.readAsDataURL(file);
    });
}

// =====================================
// STEP 6: DISPLAY COMMENTS
// =====================================

function displayComments(commentList, comments) {
    commentList.innerHTML = "";

    (comments || []).forEach(function (comment) {
        const commentItem = document.createElement("p");

        const commentAuthor = comment.user
            ? comment.user.username
            : "Unknown User";

        commentItem.textContent =
            commentAuthor + ": " + comment.text;

        commentList.appendChild(commentItem);
    });
}

// =====================================
// STEP 7: DISPLAY POST
// =====================================

function displayPost(postData) {

    const post = document.createElement("div");
    post.className = "post";

    // USER INFORMATION AND PROFILE PICTURE

    const author = document.createElement("div");
    author.className = "post-author";

    const postOwnerId = postData.user
        ? (postData.user._id || postData.user.id)
        : null;

    // PROFILE PICTURE

    const profilePic = document.createElement("img");
    profilePic.className = "post-profile-picture";

    profilePic.src =
        postData.user && postData.user.profilePicture
            ? postData.user.profilePicture
            : "https://placehold.co/40x40?text=User";

    profilePic.alt = "Profile picture";

    profilePic.onerror = function () {
        this.src = "https://placehold.co/40x40?text=User";
    };

    // USERNAME LINK

    const authorLink = document.createElement("a");

    authorLink.textContent = postData.user
        ? postData.user.username
        : "Unknown User";

    if (postOwnerId) {
        authorLink.href = "profile.html?id=" +
            encodeURIComponent(postOwnerId);
    } else {
        authorLink.href = "#";
    }

    authorLink.style.textDecoration = "none";
    authorLink.style.color = "#2563eb";

    author.appendChild(profilePic);
    author.appendChild(authorLink);

    // POST DATE AND TIME

    const postDate = document.createElement("small");
    postDate.className = "post-date";

    if (postData.createdAt) {
        const date = new Date(postData.createdAt);

        postDate.textContent = !isNaN(date.getTime())
            ? date.toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
            : "";
    } else {
        postDate.textContent = "";
    }

    // POST IMAGE

    let postImage = null;

    if (postData.image) {
        postImage = document.createElement("img");

        postImage.src = postData.image;
        postImage.alt = "Post image";

        postImage.style.display = "block";
        postImage.style.maxWidth = "100%";
        postImage.style.maxHeight = "450px";
        postImage.style.objectFit = "contain";
        postImage.style.margin = "10px 0";
        postImage.style.borderRadius = "10px";
    }

    // POST CONTENT

    const content = document.createElement("p");
    content.textContent = postData.content || "";

    const actions = document.createElement("div");
    actions.className = "post-actions";

    // CHECK POST OWNER

    const currentUserId = user.id || user._id;

    const isOwner = postOwnerId &&
        currentUserId &&
        postOwnerId.toString() === currentUserId.toString();

    // LIKE BUTTON

    const likeButton = document.createElement("button");

    const likes = postData.likes || [];

    let liked = likes.some(function (id) {
        const likeUserId = id._id || id;

        return likeUserId.toString() === currentUserId.toString();
    });

    let likeCount = likes.length;

    function updateLikeButton() {
        likeButton.textContent =
            (liked ? "Unlike " : "Like ") + likeCount;
    }

    updateLikeButton();

    likeButton.addEventListener("click", async function () {
        likeButton.disabled = true;

        try {
            const response = await fetch(
                "http://localhost:5001/api/posts/" +
                postData._id + "/like",
                {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Like operation failed.");
                return;
            }

            liked = data.liked;
            likeCount = data.likes;

            updateLikeButton();

        } catch (error) {
            console.error(error);
            alert("Cannot connect to backend server!");
        } finally {
            likeButton.disabled = false;
        }
    });

    actions.appendChild(likeButton);

    // EDIT BUTTON

    if (isOwner) {
        const editButton = document.createElement("button");
        editButton.textContent = "Edit Post";

        editButton.addEventListener("click", async function () {

            const updatedContent = prompt(
                "Edit your post:",
                postData.content
            );

            if (updatedContent === null) return;

            if (updatedContent.trim() === "") {
                alert("Post content cannot be empty!");
                return;
            }

            editButton.disabled = true;

            try {
                const response = await fetch(
                    "http://localhost:5001/api/posts/" +
                    postData._id,
                    {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify({
                            content: updatedContent.trim()
                        })
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    alert(data.message || "Failed to update post.");
                    return;
                }

                content.textContent = data.post.content;
                postData.content = data.post.content;

                alert("Post updated successfully!");

            } catch (error) {
                console.error(error);
                alert("Cannot connect to backend server!");
            } finally {
                editButton.disabled = false;
            }
        });

        actions.appendChild(editButton);
    }

    // DELETE BUTTON

    if (isOwner) {
        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete Post";
        deleteButton.className = "delete-button";

        deleteButton.addEventListener("click", async function () {

            const confirmDelete = confirm(
                "Are you sure you want to delete this post?"
            );

            if (!confirmDelete) return;

            deleteButton.disabled = true;

            try {
                const response = await fetch(
                    "http://localhost:5001/api/posts/" +
                    postData._id,
                    {
                        method: "DELETE",
                        headers: {
                            "Authorization": "Bearer " + token
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    alert(data.message || "Failed to delete post.");
                    return;
                }

                post.remove();
                alert("Post deleted successfully!");

            } catch (error) {
                console.error(error);
                alert("Cannot connect to backend server!");
            } finally {
                deleteButton.disabled = false;
            }
        });

        actions.appendChild(deleteButton);
    }

    // COMMENT SECTION

    const commentSection = document.createElement("div");
    commentSection.className = "comment-section";

    const commentHeading = document.createElement("h4");
    commentHeading.textContent = "Comments";

    const commentList = document.createElement("div");
    commentList.className = "comment-list";

    displayComments(commentList, postData.comments || []);

    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.placeholder = "Write a comment...";
    commentInput.className = "comment-input";

    const commentButton = document.createElement("button");
    commentButton.textContent = "Add Comment";

    commentButton.addEventListener("click", async function () {

        const commentText = commentInput.value.trim();

        if (commentText === "") {
            alert("Please enter a comment!");
            return;
        }

        commentButton.disabled = true;

        try {
            const response = await fetch(
                "http://localhost:5001/api/posts/" +
                postData._id + "/comments",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({
                        text: commentText
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Failed to add comment.");
                return;
            }

            displayComments(commentList, data.comments);
            commentInput.value = "";

        } catch (error) {
            console.error(error);
            alert("Cannot connect to backend server!");
        } finally {
            commentButton.disabled = false;
        }
    });

    commentSection.appendChild(commentHeading);
    commentSection.appendChild(commentList);
    commentSection.appendChild(commentInput);
    commentSection.appendChild(commentButton);

    // ADD ELEMENTS TO POST

    post.appendChild(author);
    post.appendChild(postDate);

    if (postImage) {
        post.appendChild(postImage);
    }

    post.appendChild(content);
    post.appendChild(actions);
    post.appendChild(commentSection);

    return post;
}

// =====================================
// STEP 8: SEARCH POSTS
// =====================================

if (searchInput) {
    searchInput.addEventListener("input", function () {

        const searchText = searchInput.value.toLowerCase().trim();

        const allPosts = document.querySelectorAll(
            "#postFeed .post"
        );

        allPosts.forEach(function (post) {
            const postText = post.textContent.toLowerCase();

            post.style.display = postText.includes(searchText)
                ? "block"
                : "none";
        });
    });
}

// =====================================
// STEP 9: SEARCH USERS WITH PROFILE PICTURES
// =====================================

if (userSearchInput && userSearchResults) {

    userSearchInput.addEventListener("input", async function () {

        const username = userSearchInput.value.trim();

        userSearchResults.innerHTML = "";

        if (username.length < 2) return;

        const loadingMessage = document.createElement("p");
        loadingMessage.textContent = "Searching users...";

        userSearchResults.appendChild(loadingMessage);

        try {
            const response = await fetch(
                "http://localhost:5001/api/users/search/" +
                encodeURIComponent(username),
                {
                    method: "GET",
                    headers: {
                        "Authorization": "Bearer " + token
                    }
                }
            );

            const data = await response.json();

            userSearchResults.innerHTML = "";

            if (!response.ok) {
                const errorMessage = document.createElement("p");

                errorMessage.textContent =
                    data.message || "User search failed.";

                userSearchResults.appendChild(errorMessage);
                return;
            }

            const users = data.users || [];

            if (users.length === 0) {
                const noResults = document.createElement("p");

                noResults.textContent = "No users found.";

                userSearchResults.appendChild(noResults);
                return;
            }

            users.forEach(function (foundUser) {

                const resultItem = document.createElement("div");
                resultItem.className = "user-search-item";

                const userLink = document.createElement("a");

                userLink.href = "profile.html?id=" +
                    encodeURIComponent(foundUser._id);

                userLink.className = "user-search-link";

                // SEARCH RESULT PROFILE PICTURE

                const searchProfilePic = document.createElement("img");

                searchProfilePic.src = foundUser.profilePicture ||
                    "https://placehold.co/40x40?text=User";

                searchProfilePic.alt = "Profile picture";
                searchProfilePic.className = "user-search-picture";

                searchProfilePic.onerror = function () {
                    this.src = "https://placehold.co/40x40?text=User";
                };

                // SEARCH RESULT USERNAME

                const searchUsername = document.createElement("span");
                searchUsername.textContent = foundUser.username;

                userLink.appendChild(searchProfilePic);
                userLink.appendChild(searchUsername);

                resultItem.appendChild(userLink);
                userSearchResults.appendChild(resultItem);
            });

        } catch (error) {
            console.error("User search error:", error);

            userSearchResults.innerHTML = "";

            const errorMessage = document.createElement("p");

            errorMessage.textContent = "Cannot connect to server!";

            userSearchResults.appendChild(errorMessage);
        }
    });
}

// =====================================
// STEP 10: CREATE A POST WITH IMAGE
// =====================================

if (postButton) {
    postButton.addEventListener("click", async function () {

        const postText = postInput.value.trim();

        if (postText === "" && selectedImage === "") {
            alert("Please write something or select an image!");
            return;
        }

        postButton.disabled = true;

        try {
            const response = await fetch(
                "http://localhost:5001/api/posts",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({
                        content: postText,
                        image: selectedImage
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Failed to publish post.");
                return;
            }

            const newPost = displayPost(data.post);
            newPost.dataset.postId = data.post._id;

            postFeed.prepend(newPost);

            postInput.value = "";
            selectedImage = "";

            if (imageInput) {
                imageInput.value = "";
            }

            if (imagePreview) {
                imagePreview.src = "";
                imagePreview.style.display = "none";
            }

            if (searchInput && searchInput.value.trim()) {
                searchInput.dispatchEvent(new Event("input"));
            }

            alert("Post published successfully!");

        } catch (error) {
            console.error(error);
            alert("Cannot connect to backend server!");
        } finally {
            postButton.disabled = false;
        }
    });
}

// =====================================
// STEP 11: LOAD POSTS FROM MONGODB
// =====================================

async function loadPosts() {

    try {
        const response = await fetch(
            "http://localhost:5001/api/posts",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Unable to load posts.");
            return;
        }

        postFeed.innerHTML = "";

        data.posts.forEach(function (savedPost) {

            const postElement = displayPost(savedPost);

            postElement.dataset.postId = savedPost._id;

            postFeed.appendChild(postElement);
        });

        // FIND POST FROM NOTIFICATION URL

        const urlParams = new URLSearchParams(window.location.search);
        const targetPostId = urlParams.get("post");

        if (targetPostId) {

            const targetPost = Array.from(
                postFeed.children
            ).find(post => post.dataset.postId === targetPostId);

            if (targetPost) {

                targetPost.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                targetPost.classList.add("highlight-post");

                setTimeout(() => {
                    targetPost.classList.remove("highlight-post");
                }, 4000);

            } else {
                alert("The related post could not be found.");
            }
        }

        if (searchInput && searchInput.value.trim()) {
            searchInput.dispatchEvent(new Event("input"));
        }

    } catch (error) {
        console.error(error);
        alert("Cannot connect to backend server!");
    }
}

// =====================================
// STEP 12: LOAD NOTIFICATION COUNT
// =====================================

async function loadNotificationCount() {

    const notificationBadge = document.getElementById(
        "notificationBadge"
    );

    if (!notificationBadge || !token) return;

    try {
        const response = await fetch(
            "http://localhost:5001/api/notifications",
            {
                method: "GET",
                headers: {
                    "Authorization": "Bearer " + token
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Notification count failed:", data.message);
            return;
        }

        const unreadCount = data.unreadCount || 0;

        if (unreadCount > 0) {
            notificationBadge.textContent = unreadCount;
            notificationBadge.style.display = "inline-block";
        } else {
            notificationBadge.textContent = "";
            notificationBadge.style.display = "none";
        }

    } catch (error) {
        console.error("Notification error:", error);
    }
}

// =====================================
// STEP 13: START HOMEPAGE
// =====================================

loadPosts();

loadNotificationCount();

setInterval(loadNotificationCount, 10000);
