// ==========================================
// PROFILE PAGE LOGIC & POSTS RENDERING
// ==========================================

// Keep bundled profile assets working when the app is deployed below a domain
// path (the profile page lives one folder below the project root).
function getProfileAssetPath(fileName) {
    return new URL(`../files/${fileName}`, document.baseURI).href;
}

const defaultProfileImage = () => getProfileAssetPath("vergil.jpg");
const defaultCoverImage = () => getProfileAssetPath("vergilc.jpg");

function resolveProfileImage(imagePath) {
    return imagePath === "/files/vergil.jpg" || imagePath === "files/vergil.jpg"
        ? defaultProfileImage()
        : (imagePath || defaultProfileImage());
}

function resolveCoverImage(imagePath) {
    return imagePath === "/files/vergilc.jpg" || imagePath === "files/vergilc.jpg"
        ? defaultCoverImage()
        : (imagePath || defaultCoverImage());
}

// Helper function to calculate relative time
function getRelativeTime(timestamp) {
  if (!timestamp) return "Just now";
  const elapsedSeconds = Math.floor((Date.now() - timestamp) / 1000);

  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} minutes ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)} hours ago`;
  return `${Math.floor(elapsedSeconds / 86400)} days ago`;
}

// Unified function to fetch posts safely using a single key
function getStoredPosts() {
    return JSON.parse(localStorage.getItem('moka_posts')) || [];
}

// Unified function to save posts to storage
function savePostsToStorage(posts) {
    localStorage.setItem('moka_posts', JSON.stringify(posts));
}

// Get current user data or initialize default profile
function getCurrentUser() {
    let user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        user = {
            name: "vergil",
            username: "vergil_sparda",
            bio: "The Storm is appropriate...",
            profile_image: defaultProfileImage(),
            cover_image: defaultCoverImage()
        };
        localStorage.setItem('user', JSON.stringify(user));
    } else {
        // Migrate the old root-based defaults so existing browser data also works.
        const profileImage = resolveProfileImage(user.profile_image);
        const coverImage = resolveCoverImage(user.cover_image);
        if (profileImage !== user.profile_image || coverImage !== user.cover_image) {
            user.profile_image = profileImage;
            user.cover_image = coverImage;
            localStorage.setItem('user', JSON.stringify(user));
        }
    }
    return user;
}

document.addEventListener('DOMContentLoaded', () => {
    const userAvatarImg = document.getElementById('userAvatar');
    const avatarContainer = document.getElementById('avatarContainer');
    const avatarUploadInput = document.getElementById('avatarUploadInput');

    const coverImage = document.getElementById('coverImage');
    const editCoverBtn = document.getElementById('editCoverBtn');
    const coverUploadInput = document.getElementById('coverUploadInput');

    const userBioText = document.getElementById('userBioText');
    const userPostsTab = document.getElementById('userPostsTab');
    const savedItemsTab = document.getElementById('savedItemsTab');
    const profileContentArea = document.getElementById('profileContentArea');

    const postsCountEl = document.getElementById('postsCount');
    const savedCountEl = document.getElementById('savedCount');

    // Load profile data and initialize default state
    function loadProfileData() {
        const user = getCurrentUser();
        
        if (userAvatarImg) userAvatarImg.src = resolveProfileImage(user.profile_image);
        if (coverImage) coverImage.src = resolveCoverImage(user.cover_image);
        if (userBioText) userBioText.textContent = user.bio || "The Storm is appropriate...";

        const nameHeading = document.querySelector('.user-name-row h1');
        if (nameHeading) nameHeading.textContent = user.name || "vergil";

        const handleSpan = document.querySelector('.user-handle');
        if (handleSpan) handleSpan.textContent = `@${user.username || "vergil_sparda"}`;

        if (!localStorage.getItem('moka_posts')) {
            savePostsToStorage([{ 
                id: 1, 
                title: "Welcome to Moka Cafe Social! ☕",
                body: "This is your local feed powered by LocalStorage. Enjoy building your app!",
                tags: ["moka", "cafe", "welcome"],
                image: "",
                author: { name: user.name, username: user.username, profile_image: user.profile_image },
                created_at: Date.now() - 120000,
                likes: [],
                comments: [],
                saves: []
            }]);
        }

        updateStats();
        renderUserPosts();
        initLightboxModal();
        initCommentsModal();
        initEditPostModalDOM();
    }

    // Update user statistics counters
    function updateStats() {
        const posts = getStoredPosts();
        const user = getCurrentUser();
        
        const userPosts = posts.filter(p => p.author?.username === user.username);
        const savedPostIds = JSON.parse(localStorage.getItem(`saved_posts_${user.username}`)) || [];
        
        if (postsCountEl) postsCountEl.textContent = userPosts.length;
        if (savedCountEl) savedCountEl.textContent = savedPostIds.length;
    }

    // Handle Avatar Upload
    if (avatarContainer && avatarUploadInput) {
        avatarContainer.addEventListener('click', () => avatarUploadInput.click());
        avatarUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    let user = getCurrentUser();
                    user.profile_image = event.target.result;
                    localStorage.setItem('user', JSON.stringify(user));
                    loadProfileData();
                    alert('Profile picture updated successfully!');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle Cover Image Upload
    if (editCoverBtn && coverUploadInput) {
        editCoverBtn.addEventListener('click', () => coverUploadInput.click());
        coverUploadInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    let user = getCurrentUser();
                    user.cover_image = event.target.result;
                    localStorage.setItem('user', JSON.stringify(user));
                    loadProfileData();
                    alert('Cover photo updated successfully!');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    window.handleUserProfileClick = () => window.location.reload();

    // Generate HTML card for a single post
    function generatePostCardHTML(post, user, isOwner = false) {
        const author = post.author || {};
        const authorImage = resolveProfileImage(author.profile_image || user.profile_image);
        const authorName = author.name || user.name || "vergil";
        const authorUsername = author.username || user.username || "vergil_sparda";
        
        const imageHtml = post.image ? `
            <div class="post-image-container" style="cursor: pointer; margin-top: 10px;" onclick="openLightbox('${post.image}')">
              <img src="${post.image}" class="post-img" style="width: 100%; max-height: 280px; object-fit: cover; border-radius: 8px;" />
            </div>` : "";

        let tagsHtml = "";
        if (post.tags?.length > 0) {
            tagsHtml = `<div class="post-tags-bar" style="display: flex; gap: 6px; flex-wrap: wrap; margin: 8px 0;">`;
            post.tags.forEach(tag => {
                tagsHtml += `<span class="badge bg-secondary text-light tag-chip" style="font-size: 11px; padding: 4px 8px; border-radius: 6px; background: #251b37; color: #c084fc;">#${tag.trim().replace("#", "")}</span>`;
            });
            tagsHtml += `</div>`;
        }

        const isLiked = post.likes?.includes(user.username);
        const isSaved = post.saves?.includes(user.username);

        const ownerActionsHTML = isOwner ? `
            <div style="display: flex; gap: 6px;">
                <button onclick="openEditPostModal(${post.id})" title="Edit" style="background: rgba(255,255,255,0.05); border: none; color: #c084fc; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-pen" style="font-size: 12px;"></i></button>
                <button onclick="deletePost(${post.id})" title="Delete" style="background: rgba(239,68,68,0.1); border: none; color: #ef4444; width: 30px; height: 30px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-trash-can" style="font-size: 12px;"></i></button>
            </div>
        ` : '';

        return `
        <div class="post-card" data-post-id="${post.id}" style="background: #151024; padding: 14px; border-radius: 14px; margin-bottom: 16px; text-align: left; font-size: 13px; border: 1px solid #2a2040; box-shadow: 0 4px 16px rgba(0,0,0,0.4);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
                <div class="post-author" style="display: flex; align-items: center; gap: 10px; cursor: pointer;" onclick="handleUserProfileClick('${authorUsername}')">
                  <img src="${authorImage}" class="author-avatar" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;" />
                  <div class="author-info" style="display: flex; flex-direction: column; justify-content: center;">
                    <h4 class="author-name" style="margin: 0; font-size: 14px; font-weight: 600; color: #fff;">${authorName}</h4>
                    <span class="post-time" style="font-size: 11px; color: #9ca3af;">${getRelativeTime(post.created_at)}</span>
                  </div>
                </div>
                ${ownerActionsHTML}
            </div>
            <div class="post-texts" style="color: #e5e7eb;">
              <h3 style="font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #fff;">${post.title || ""}</h3>
              <p style="font-size: 12.5px; color: #d1d5db; margin: 0;">${post.body || ""}</p>
            </div>
            ${imageHtml}
            ${tagsHtml}
            <div class="post-btns" style="display: flex; gap: 18px; margin-top: 10px; padding-top: 8px; border-top: 1px solid #251b37;">
              <button onclick="toggleLike(${post.id})" style="background: none; border: none; color: #9ca3af; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 12px;">
                <i class="${isLiked ? 'fa-solid text-danger' : 'fa-regular'} fa-heart" style="${isLiked ? 'color: #ef4444;' : ''}"></i> 
                <span>${post.likes?.length || 0}</span>
              </button>
              <button onclick="toggleSavePost(${post.id})" style="background: none; border: none; color: #9ca3af; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 12px;">
                <i class="${isSaved ? 'fa-solid text-warning' : 'fa-regular'} fa-bookmark" style="${isSaved ? 'color: #f59e0b;' : ''}"></i>
                <span>${post.saves?.length || 0}</span>
              </button>
              <button onclick="sharePost(${post.id})" style="background: none; border: none; color: #9ca3af; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 12px;">
                <i class="fa-solid fa-share-nodes"></i>
              </button>
              <button onclick="openCommentsModal(${post.id})" style="background: none; border: none; color: #9ca3af; cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 12px;">
                <i class="fa-regular fa-comment"></i> <span>${post.comments?.length || 0}</span>
              </button>
            </div>
        </div>`;
    }

    // Render user posts in the profile view
    function renderUserPosts() {
        if (!profileContentArea) return;
        const posts = getStoredPosts();
        const user = getCurrentUser();
        const userPosts = posts.filter(p => p.author?.username === user.username);

        profileContentArea.innerHTML = userPosts.length ? 
            userPosts.map(post => generatePostCardHTML(post, user, true)).join('') : 
            '<p style="color: #9ca3af; font-size: 13px; text-align: center; padding: 40px 0;">No posts published yet.</p>';
    }

    // Render saved items in the profile view
    function renderSavedItems() {
        if (!profileContentArea) return;
        const posts = getStoredPosts();
        const user = getCurrentUser();
        const savedPostIds = JSON.parse(localStorage.getItem(`saved_posts_${user.username}`)) || [];
        const savedPosts = posts.filter(p => savedPostIds.includes(p.id) || p.saves?.includes(user.username));

        profileContentArea.innerHTML = savedPosts.length ? 
            savedPosts.map(post => generatePostCardHTML(post, user, false)).join('') : 
            '<p style="color: #9ca3af; font-size: 13px; text-align: center; padding: 40px 0;">No saved items found.</p>';
    }

    // Delete a specific post by ID
    window.deletePost = function(postId) {
        if (!confirm("Are you sure you want to permanently delete this post?")) return;
        savePostsToStorage(getStoredPosts().filter(p => p.id !== postId));
        renderUserPosts();
        updateStats();
    };

    // Initialize edit post modal DOM structure
    function initEditPostModalDOM() {
        if (document.getElementById("customEditPostModal")) return;
        document.body.insertAdjacentHTML('beforeend', `
          <div id="customEditPostModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.8); z-index:99999; justify-content:center; align-items:center; padding: 20px;">
            <div style="background: #1a1528; border: 1px solid #3b2a56; padding: 20px; border-radius: 14px; width: 100%; max-width: 500px; display: flex; flex-direction: column; gap: 12px;">
              <h3 style="margin: 0; color: #fff; font-size: 16px;">Edit Post</h3>
              <input type="text" id="editPostTitleInput" placeholder="Title..." style="background: #120e1d; border: 1px solid #2d2342; padding: 10px; border-radius: 8px; color: #fff; outline: none;" />
              <textarea id="editPostBodyInput" rows="4" placeholder="Content..." style="background: #120e1d; border: 1px solid #2d2342; padding: 10px; border-radius: 8px; color: #fff; outline: none; resize: none;"></textarea>
              <input type="text" id="editPostTagsInput" placeholder="Tags (comma separated)" style="background: #120e1d; border: 1px solid #2d2342; padding: 10px; border-radius: 8px; color: #fff; outline: none;" />
              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="closeEditPostModal()" style="background: #2d2342; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Cancel</button>
                <button onclick="saveEditedPostData()" style="background: #9333ea; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Save</button>
              </div>
            </div>
          </div>
        `);
    }

    window.openEditPostModal = function(postId) {
        const post = getStoredPosts().find(p => p.id === postId);
        if (!post) return;
        const modal = document.getElementById("customEditPostModal");
        modal.dataset.editingPostId = postId;
        document.getElementById("editPostTitleInput").value = post.title || "";
        document.getElementById("editPostBodyInput").value = post.body || "";
        document.getElementById("editPostTagsInput").value = post.tags ? post.tags.join(", ") : "";
        modal.style.display = "flex";
    };

    window.closeEditPostModal = () => document.getElementById("customEditPostModal").style.display = "none";

    window.saveEditedPostData = function() {
        const modal = document.getElementById("customEditPostModal");
        const postId = Number(modal.dataset.editingPostId);
        let posts = getStoredPosts();
        const post = posts.find(p => p.id === postId);
        
        if (post) {
            post.title = document.getElementById("editPostTitleInput").value;
            post.body = document.getElementById("editPostBodyInput").value;
            post.tags = document.getElementById("editPostTagsInput").value.split(",").map(t => t.trim()).filter(Boolean);
            savePostsToStorage(posts);
            closeEditPostModal();
            renderUserPosts();
        }
    };

    // Tab switching event listeners
    if (userPostsTab && savedItemsTab) {
        userPostsTab.addEventListener('click', () => {
            userPostsTab.classList.add('active');
            savedItemsTab.classList.remove('active');
            renderUserPosts();
        });
        savedItemsTab.addEventListener('click', () => {
            savedItemsTab.classList.add('active');
            userPostsTab.classList.remove('active');
            renderSavedItems();
        });
    }

    // Toggle post like status
    window.toggleLike = function(postId) {
        let posts = getStoredPosts();
        const user = getCurrentUser();
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        post.likes = post.likes || [];
        const idx = post.likes.indexOf(user.username);
        idx > -1 ? post.likes.splice(idx, 1) : post.likes.push(user.username);

        savePostsToStorage(posts);
        userPostsTab.classList.contains('active') ? renderUserPosts() : renderSavedItems();
        updateStats();
    };

    // Toggle save post status
    window.toggleSavePost = function(postId) {
        let posts = getStoredPosts();
        const user = getCurrentUser();
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        post.saves = post.saves || [];
        const idx = post.saves.indexOf(user.username);
        idx > -1 ? post.saves.splice(idx, 1) : post.saves.push(user.username);
        savePostsToStorage(posts);

        let saved = JSON.parse(localStorage.getItem(`saved_posts_${user.username}`)) || [];
        saved = idx > -1 ? saved.filter(id => id !== postId) : [...new Set([...saved, postId])];
        localStorage.setItem(`saved_posts_${user.username}`, JSON.stringify(saved));

        userPostsTab.classList.contains('active') ? renderUserPosts() : renderSavedItems();
        updateStats();
    };

    // Share post link utility
    window.sharePost = async function(postId) {
        const post = getStoredPosts().find(p => p.id === postId);
        const url = `${window.location.href.split('#')[0]}#post-${postId}`;
        try {
            if (navigator.share) await navigator.share({ title: post?.title, url });
            else { await navigator.clipboard.writeText(url); alert("Link copied!"); }
        } catch {}
    };

    // Initialize image lightbox modal
    function initLightboxModal() {
        if (document.getElementById("customLightboxModal")) return;
        document.body.insertAdjacentHTML('beforeend', `
          <div id="customLightboxModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999; justify-content:center; align-items:center; cursor:pointer;" onclick="this.style.display='none'">
            <img id="lightboxImg" style="max-width:90%; max-height:85vh; border-radius:12px;" />
          </div>
        `);
    }

    window.openLightbox = (src) => {
        document.getElementById("lightboxImg").src = src;
        document.getElementById("customLightboxModal").style.display = "flex";
    };

    // Initialize comments modal and handlers
    function initCommentsModal() {
        if (document.getElementById("customCommentsModal")) return;
        document.body.insertAdjacentHTML('beforeend', `
          <div id="customCommentsModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:#121212; z-index:99999; flex-direction:column;">
            <div style="padding:14px; background:#1a1a1a; display:flex; justify-content:space-between; align-items:center;">
              <button onclick="closeCommentsModal()" style="background:none; border:none; color:#fff; font-size:18px; cursor:pointer;"><i class="fa-solid fa-arrow-left"></i></button>
              <span id="commentsCountHeader" style="color:#aaa; font-size:12px;">0 comments</span>
            </div>
            <div id="commentsListContainer" style="padding:15px; overflow-y:auto; flex:1; max-width:800px; width:100%; margin:0 auto; display:flex; flex-direction:column; gap:12px;"></div>
            <div style="padding:12px; background:#1a1a1a; display:flex; justify-content:center;">
              <div style="max-width:800px; width:100%; display:flex; gap:8px;">
                <input type="text" id="commentInputText" placeholder="Write a comment..." style="flex:1; background:#252525; border:1px solid #3d3d3d; border-radius:20px; padding:10px 15px; color:#fff; outline:none;" />
                <button id="submitCommentBtn" style="background:#9333ea; color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer;"><i class="fa-solid fa-paper-plane"></i></button>
              </div>
            </div>
          </div>
        `);

        document.getElementById("submitCommentBtn").addEventListener("click", () => {
            const modal = document.getElementById("customCommentsModal");
            const postId = modal.dataset.currentPostId;
            const input = document.getElementById("commentInputText");
            const text = input.value.trim();
            if (!postId || !text) return;

            let posts = getStoredPosts();
            const post = posts.find(p => String(p.id) === String(postId));
            if (post) {
                const user = getCurrentUser();
                post.comments = post.comments || [];
                post.comments.push({
                    id: Date.now(),
                    body: text,
                    author: { name: user.name, profile_image: user.profile_image },
                    created_at: new Date().toISOString()
                });
                savePostsToStorage(posts);
                input.value = "";
                renderCommentsList(post);
                userPostsTab.classList.contains('active') ? renderUserPosts() : renderSavedItems();
            }
        });
    }

    window.openCommentsModal = function(postId) {
        initCommentsModal();
        const post = getStoredPosts().find(p => String(p.id) === String(postId));
        if (!post) return;
        const modal = document.getElementById("customCommentsModal");
        modal.dataset.currentPostId = postId;
        modal.style.display = "flex";
        renderCommentsList(post);
    };

    window.closeCommentsModal = () => document.getElementById("customCommentsModal").style.display = "none";

    // Render list of comments inside the comments modal
    function renderCommentsList(post) {
        const container = document.getElementById("commentsListContainer");
        const countHeader = document.getElementById("commentsCountHeader");
        const comments = post.comments || [];
        
        if (countHeader) countHeader.textContent = `${comments.length} comments`;
        container.innerHTML = comments.length ? comments.map(c => `
            <div style="display:flex; gap:10px; align-items:flex-start;">
              <img src="${resolveProfileImage(c.author?.profile_image)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;" />
              <div style="background:#1a1a1a; padding:8px 12px; border-radius:10px; flex:1;">
                <div style="display:flex; justify-content:space-between; margin-bottom:3px;">
                  <span style="font-size:12px; font-weight:600; color:#e2e2e2;">${c.author?.name || "User"}</span>
                  <span style="font-size:10px; color:#777;">${getRelativeTime(new Date(c.created_at).getTime())}</span>
                </div>
                <p style="margin:0; font-size:13px; color:#ccc;">${c.body}</p>
              </div>
            </div>
        `).join('') : '<p style="color:#777; text-align:center; margin-top:40px;">No comments yet.</p>';
    }

    // Initial load call
    loadProfileData();
});
