
const API_URL = "http://localhost:5001/api";

const token = localStorage.getItem("token");
const currentUser = JSON.parse(localStorage.getItem("user") || "null");

if (!token || !currentUser) {
    window.location.href = "login.html";
}

const currentUserId = String(currentUser?.id || currentUser?._id);
const params = new URLSearchParams(window.location.search);
const selectedUserId = params.get("id") || currentUserId;

const profilePicture = document.getElementById("profilePicture");
const profileUsername = document.getElementById("profileUsername");
const profileEmail = document.getElementById("profileEmail");
const profileBio = document.getElementById("profileBio");

const followersCount = document.getElementById("followersCount");
const followingCount = document.getElementById("followingCount");

const followButton = document.getElementById("followButton");

const editProfileButton = document.getElementById("editProfileButton");
const editProfileSection = document.getElementById("editProfileSection");

const bioInput = document.getElementById("bioInput");
const pictureInput = document.getElementById("pictureInput");
const profileImagePreview = document.getElementById("profileImagePreview");

const saveProfileButton = document.getElementById("saveProfileButton");
const profileMessage = document.getElementById("profileMessage");

const emailContainer = document.getElementById("emailContainer");
const myPosts = document.getElementById("myPosts");

const isOwnProfile = selectedUserId === currentUserId;

let selectedProfileImage = "";
let isEditingProfile = false;


// REQUEST HEADERS
function getHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


// LOGOUT
document.getElementById("logoutButton")?.addEventListener("click", () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "login.html";
});


// OPEN AND CLOSE EDIT PROFILE
editProfileButton?.addEventListener("click", () => {

    isEditingProfile = !isEditingProfile;

    editProfileSection.style.display =
        isEditingProfile ? "block" : "none";

    editProfileButton.textContent =
        isEditingProfile ? "Cancel Editing" : "Edit Profile";

    if (isEditingProfile) {
        profileMessage.textContent = "";
    }
});


// LOAD PROFILE
async function loadProfile() {

    try {

        const response = await fetch(
            `${API_URL}/users/${selectedUserId}`,
            { headers: getHeaders() }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Could not load profile.");
        }

        const user = data.user;

        profileUsername.textContent = user.username;

        profileBio.textContent = user.bio || "No bio added yet.";

        profilePicture.src = user.profilePicture ||
            "https://placehold.co/150x150?text=Profile";

        if (user.email) {

            profileEmail.textContent = user.email;
            emailContainer.style.display = "block";

        } else {

            emailContainer.style.display = "none";

        }

        if (isOwnProfile) {

            editProfileButton.style.display = "inline-block";

            editProfileSection.style.display =
                isEditingProfile ? "block" : "none";

            editProfileButton.textContent =
                isEditingProfile ? "Cancel Editing" : "Edit Profile";

            bioInput.value = user.bio || "";

            pictureInput.value = "";
            selectedProfileImage = "";

            profileImagePreview.src = user.profilePicture || "";

            profileImagePreview.style.display = user.profilePicture
                ? "block"
                : "none";

            followButton.style.display = "none";

        } else {

            editProfileButton.style.display = "none";
            editProfileSection.style.display = "none";

            followButton.style.display = "inline-block";

        }

    } catch (error) {

        alert(error.message);

    }
}


// PROFILE IMAGE PREVIEW
pictureInput?.addEventListener("change", () => {

    const file = pictureInput.files[0];

    selectedProfileImage = "";
    profileMessage.textContent = "";

    if (!file) {

        profileImagePreview.style.display = "none";
        return;

    }

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        pictureInput.value = "";
        profileImagePreview.style.display = "none";

        return;

    }

    if (file.size > 5 * 1024 * 1024) {

        alert("Image size must be less than 5 MB.");

        pictureInput.value = "";
        profileImagePreview.style.display = "none";

        return;

    }

    const reader = new FileReader();

    reader.onload = function (event) {

        selectedProfileImage = event.target.result;

        profileImagePreview.src = selectedProfileImage;
        profileImagePreview.style.display = "block";

    };

    reader.onerror = function () {

        alert("Unable to read the selected image.");

        pictureInput.value = "";

    };

    reader.readAsDataURL(file);

});


// SAVE PROFILE
saveProfileButton?.addEventListener("click", async () => {

    try {

        const bio = bioInput.value.trim();

        if (bio.length > 200) {

            alert("Bio cannot exceed 200 characters.");
            return;

        }

        saveProfileButton.disabled = true;

        profileMessage.textContent = "Saving profile...";

        const response = await fetch(
            `${API_URL}/users/profile/update`,
            {
                method: "PUT",
                headers: getHeaders(),

                body: JSON.stringify({
                    bio,
                    profilePicture: selectedProfileImage
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.message || "Profile update failed.");

        }

        // UPDATE SUCCESS MESSAGE
        profileMessage.textContent = "Profile updated successfully!";

        pictureInput.value = "";
        selectedProfileImage = "";

        // CLOSE EDITING SECTION
        isEditingProfile = false;

        editProfileSection.style.display = "none";

        editProfileButton.textContent = "Edit Profile";

        // REFRESH PROFILE DETAILS
        await loadProfile();

    } catch (error) {

        profileMessage.textContent = error.message;

    } finally {

        saveProfileButton.disabled = false;

    }

});


// LOAD FOLLOWERS AND FOLLOWING
async function loadFollowDetails() {

    try {

        const response = await fetch(
            `${API_URL}/follows/${selectedUserId}`,
            { headers: getHeaders() }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.message || "Could not load follow details."
            );

        }

        followersCount.textContent = data.followersCount;
        followingCount.textContent = data.followingCount;

        if (!isOwnProfile) {

            followButton.textContent =
                data.isFollowing ? "Unfollow" : "Follow";

        }

    } catch (error) {

        console.error("Follow details error:", error);

    }

}


// FOLLOW / UNFOLLOW
followButton?.addEventListener("click", async () => {

    try {

        followButton.disabled = true;

        const isFollowing =
            followButton.textContent.trim() === "Unfollow";

        const response = await fetch(
            `${API_URL}/follows/${selectedUserId}/follow`,
            {
                method: isFollowing ? "DELETE" : "POST",
                headers: getHeaders()
            }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.message || "Follow action failed.");

        }

        await loadFollowDetails();

    } catch (error) {

        alert(error.message);

    } finally {

        followButton.disabled = false;

    }

});


// LOAD USER POSTS
async function loadUserPosts() {

    try {

        const response = await fetch(
            `${API_URL}/posts`,
            { headers: getHeaders() }
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(data.message || "Could not load posts.");

        }

        myPosts.innerHTML = "";

        const posts = data.posts || [];

        const userPosts = posts.filter(post => {

            const postUserId = post.user?._id || post.user?.id;

            return String(postUserId) === selectedUserId;

        });

        if (userPosts.length === 0) {

            myPosts.textContent = "No posts yet.";

            return;

        }

        userPosts.forEach(post => {

            const postCard = document.createElement("div");

            postCard.className = "post-card";


            // USERNAME
            const username = document.createElement("h4");

            username.textContent = post.user?.username || "User";

            postCard.appendChild(username);


            // POST IMAGE
            if (post.image) {

                const postImage = document.createElement("img");

                postImage.src = post.image;
                postImage.alt = "Post image";

                postImage.style.display = "block";
                postImage.style.maxWidth = "100%";
                postImage.style.maxHeight = "400px";
                postImage.style.objectFit = "contain";
                postImage.style.margin = "10px 0";
                postImage.style.borderRadius = "10px";

                postCard.appendChild(postImage);

            }


            // POST CONTENT
            const content = document.createElement("p");

            content.textContent = post.content || "";

            postCard.appendChild(content);


            // LIKE BUTTON
            const likeButton = document.createElement("button");

            const isLiked = (post.likes || []).some(like => {

                const likeId = like?._id || like;

                return String(likeId) === currentUserId;

            });

            likeButton.textContent = isLiked ? "Unlike" : "Like";

            const likeCount = document.createElement("span");

            likeCount.textContent =
                ` ${post.likes?.length || 0} Likes`;


            likeButton.addEventListener("click", async () => {

                try {

                    likeButton.disabled = true;

                    const likeResponse = await fetch(
                        `${API_URL}/posts/${post._id}/like`,
                        {
                            method: "POST",
                            headers: getHeaders()
                        }
                    );

                    const likeData = await likeResponse.json();

                    if (!likeResponse.ok) {

                        throw new Error(
                            likeData.message || "Like action failed."
                        );

                    }

                    await loadUserPosts();

                } catch (error) {

                    alert(error.message);

                    likeButton.disabled = false;

                }

            });

            postCard.appendChild(likeButton);
            postCard.appendChild(likeCount);


            // COMMENTS SECTION
            const commentsSection = document.createElement("div");

            commentsSection.className = "comments-section";

            const commentsHeading = document.createElement("h4");

            commentsHeading.textContent =
                `Comments (${post.comments?.length || 0})`;

            commentsSection.appendChild(commentsHeading);

            const commentsList = document.createElement("div");


            (post.comments || []).forEach(comment => {

                const commentItem = document.createElement("p");

                const commentUsername = document.createElement("strong");

                commentUsername.textContent =
                    (comment.user?.username || "User") + ": ";

                const commentText = document.createElement("span");

                commentText.textContent = comment.text || "";

                commentItem.appendChild(commentUsername);
                commentItem.appendChild(commentText);

                commentsList.appendChild(commentItem);

            });

            commentsSection.appendChild(commentsList);


            // ADD COMMENT
            const commentInput = document.createElement("input");

            commentInput.type = "text";
            commentInput.placeholder = "Write a comment...";

            const commentButton = document.createElement("button");

            commentButton.textContent = "Add Comment";


            commentButton.addEventListener("click", async () => {

                const commentText = commentInput.value.trim();

                if (!commentText) {

                    alert("Please write a comment.");

                    return;

                }

                try {

                    commentButton.disabled = true;

                    const commentResponse = await fetch(
                        `${API_URL}/posts/${post._id}/comments`,
                        {
                            method: "POST",
                            headers: getHeaders(),

                            body: JSON.stringify({
                                text: commentText
                            })
                        }
                    );

                    const commentData = await commentResponse.json();

                    if (!commentResponse.ok) {

                        throw new Error(
                            commentData.message || "Failed to add comment."
                        );

                    }

                    await loadUserPosts();

                } catch (error) {

                    alert(error.message);

                    commentButton.disabled = false;

                }

            });

            commentsSection.appendChild(commentInput);
            commentsSection.appendChild(commentButton);

            postCard.appendChild(commentsSection);


            // EDIT AND DELETE ONLY ON OWN PROFILE
            if (isOwnProfile) {

                const actions = document.createElement("div");

                actions.className = "post-actions";


                // EDIT POST
                const editButton = document.createElement("button");

                editButton.textContent = "Edit Post";


                editButton.addEventListener("click", async () => {

                    const updatedContent = prompt(
                        "Edit your post caption:",
                        post.content || ""
                    );

                    if (updatedContent === null) return;

                    if (!updatedContent.trim()) {

                        alert("Post content cannot be empty.");

                        return;

                    }

                    try {

                        editButton.disabled = true;

                        const editResponse = await fetch(
                            `${API_URL}/posts/${post._id}`,
                            {
                                method: "PUT",
                                headers: getHeaders(),

                                body: JSON.stringify({
                                    content: updatedContent.trim()
                                })
                            }
                        );

                        const editData = await editResponse.json();

                        if (!editResponse.ok) {

                            throw new Error(
                                editData.message || "Failed to update post."
                            );

                        }

                        await loadUserPosts();

                        alert("Post updated successfully!");

                    } catch (error) {

                        alert(error.message);

                    } finally {

                        editButton.disabled = false;

                    }

                });


                // DELETE POST
                const deleteButton = document.createElement("button");

                deleteButton.textContent = "Delete Post";

                deleteButton.className = "delete-button";


                deleteButton.addEventListener("click", async () => {

                    if (!confirm("Are you sure you want to delete this post?")) {

                        return;

                    }

                    try {

                        deleteButton.disabled = true;

                        const deleteResponse = await fetch(
                            `${API_URL}/posts/${post._id}`,
                            {
                                method: "DELETE",
                                headers: getHeaders()
                            }
                        );

                        const deleteData = await deleteResponse.json();

                        if (!deleteResponse.ok) {

                            throw new Error(
                                deleteData.message || "Failed to delete post."
                            );

                        }

                        await loadUserPosts();

                        alert("Post deleted successfully!");

                    } catch (error) {

                        alert(error.message);

                        deleteButton.disabled = false;

                    }

                });


                actions.appendChild(editButton);
                actions.appendChild(deleteButton);

                postCard.appendChild(actions);

            }

            myPosts.appendChild(postCard);

        });

    } catch (error) {

        console.error("Posts error:", error);

        myPosts.textContent = "Unable to load posts.";

    }

}


// INITIALIZE PROFILE
loadProfile();

loadFollowDetails();

loadUserPosts();
