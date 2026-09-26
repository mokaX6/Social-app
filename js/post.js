// ==========================================
// SCRIPT: POSTS MANAGEMENT (FETCH, CREATE, EDIT, DELETE, INTERACTIONS)
// ==========================================

function getRelativeTime(timestamp) {
  if (!timestamp) return "Just now";
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - timestamp) / 1000);

  if (elapsedSeconds < 60) {
    return "Just now";
  } else if (elapsedSeconds < 3600) {
    const minutes = Math.floor(elapsedSeconds / 60);
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  } else if (elapsedSeconds < 86400) {
    const hours = Math.floor(elapsedSeconds / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  } else {
    const days = Math.floor(elapsedSeconds / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
}

// Helper function to navigate to user profile with auth check
window.goToUserProfile = function(username) {
  const token = localStorage.getItem("token");
  if (!token) {
    showToast("Please login first to view user profile!", "error");
    return;
  }
  if (!username) return;
  window.location.href = `profile/profile.html?username=${encodeURIComponent(username)}`;
};

function fetchingPosts(filterQuery = "", tagFilter = null) {
  const defaultPost = {
    id: 1,
    title: "Welcome to Moka Cafe Social! ☕",
    body: "This is your local feed powered by LocalStorage.",
    tags: ["moka", "cafe", "welcome"],
    image: "files/bill.gif",
    author: { name: "Moka Admin", username: "moka_admin", profile_image: "files/moka.jpg" },
    created_at: Date.now() - 120000,
    likes: [],
    comments: [],
    saves: []
  };

  // التأكد من وجود البوست الافتراضي دائماً وعدم اختفائه عند إضافة بوستات جديدة
  let posts = JSON.parse(localStorage.getItem("moka_posts"));
  if (!posts || !Array.isArray(posts)) {
    posts = [defaultPost];
    localStorage.setItem("moka_posts", JSON.stringify(posts));
  } else {
    // التحقق مما إذا كان البوست الافتراضي (id: 1) غير موجود، فنقوم بإضافته ليظل ثابتاً دائماً
    const hasDefault = posts.some(p => Number(p.id) === 1);
    if (!hasDefault) {
      posts.unshift(defaultPost);
      localStorage.setItem("moka_posts", JSON.stringify(posts));
    }
  }

  let users = JSON.parse(localStorage.getItem("moka_users")) || [];
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUsername = currentUser ? currentUser.username : null;

  if (tagFilter) {
    posts = posts.filter(post => post.tags && post.tags.map(t => t.toLowerCase()).includes(tagFilter.toLowerCase()));
  }

  let matchedUsers = [];
  let matchingPosts = [...posts];

  if (filterQuery) {
    const searchTerm = filterQuery.toLowerCase().trim().replace("#", "");
    
    // Search users by name or username
    matchedUsers = users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm) || 
      u.username?.toLowerCase().includes(searchTerm)
    );

    // Filter regular posts by title, body, author name/username, or tags
    matchingPosts = posts.filter(post => {
      const matchTitle = post.title?.toLowerCase().includes(searchTerm);
      const matchBody = post.body?.toLowerCase().includes(searchTerm);
      const matchName = post.author?.name?.toLowerCase().includes(searchTerm);
      const matchUsername = post.author?.username?.toLowerCase().includes(searchTerm);
      const matchTags = post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      return matchTitle || matchBody || matchName || matchUsername || matchTags;
    });
  }

  let allPostsHTML = "";

  // Render matched users section if searching by user name/username
  if (filterQuery && matchedUsers.length > 0) {
    allPostsHTML += `<div class="users-search-results mb-3" style="display: flex; flex-direction: column; gap: 10px;">`;
    allPostsHTML += `<h6 style="color: #a855f7; font-size: 13px; margin-bottom: 5px;">Users Found:</h6>`;
    matchedUsers.forEach(u => {
      const uAvatar = u.profile_image || "https://via.placeholder.com/40";
      const uName = u.name || "User";
      const uUsername = u.username || "";
      allPostsHTML += `
        <div class="user-search-card" onclick="goToUserProfile('${uUsername}')" style="display: flex; align-items: center; gap: 12px; background: rgba(25, 20, 45, 0.8); border: 1px solid rgba(147, 51, 234, 0.2); padding: 10px 14px; border-radius: 12px; cursor: pointer; transition: all 0.2s;">
          <img src="${uAvatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />
          <div style="display: flex; flex-direction: column;">
            <span style="font-weight: 600; font-size: 14px; color: #fff;">${uName}</span>
            <span style="font-size: 12px; color: #a1a1aa;">@${uUsername}</span>
          </div>
        </div>
      `;
    });
    allPostsHTML += `</div>`;
  }

  if (matchingPosts.length === 0 && matchedUsers.length === 0) {
    allPostsHTML += `
      <div class="text-center text-muted py-5">
        <p>No results found.</p>
        ${tagFilter ? `<button class="btn btn-sm btn-outline-primary mt-2" onclick="clearTagFilter()">Show All Posts</button>` : ""}
      </div>`;
  } else {
    if (tagFilter) {
      allPostsHTML += `
        <div class="alert alert-secondary d-flex justify-content-between align-items-center mb-3 py-2 px-3" style="font-size: 13px; border-radius: 8px;">
          <span>Filtering by tag: <b>#${tagFilter}</b></span>
          <button class="btn btn-sm btn-dark" style="font-size: 11px;" onclick="clearTagFilter()">Reset Filter</button>
        </div>`;
    }

    matchingPosts.forEach(post => {
      const authorImage = post.author?.profile_image || "https://via.placeholder.com/40";
      const authorName = post.author?.name || "Unknown User";
      const authorUsername = post.author?.username || "";
      
      const imageHtml = post.image ? `
        <div class="post-image-container" style="cursor: pointer;" onclick="openLightbox('${post.image}')">
          <img src="${post.image}" class="post-img" unselectable="on" />
        </div>` : "";

      let tagsHtml = "";
      if (post.tags && post.tags.length > 0) {
        tagsHtml = `<div class="post-tags-bar" style="display: flex; gap: 6px; flex-wrap: wrap; margin: 10px 0;">`;
        post.tags.forEach(tag => {
          const cleanTag = tag.trim().replace("#", "");
          tagsHtml += `<span class="badge bg-secondary text-light tag-chip" style="font-size: 11px; padding: 5px 10px; border-radius: 6px; cursor: pointer;" onclick="filterByTag('${cleanTag}')">#${cleanTag}</span>`;
        });
        tagsHtml += `</div>`;
      }

      const likesCount = post.likes ? post.likes.length : 0;
      const isLiked = currentUsername && post.likes && post.likes.includes(currentUsername);
      const heartIconClass = isLiked ? "fa-solid text-danger" : "fa-regular";

      const savesCount = post.saves ? post.saves.length : 0;
      const isSaved = currentUsername && post.saves && post.saves.includes(currentUsername);
      const saveIconClass = isSaved ? "fa-solid text-warning" : "fa-regular";

      const commentsCount = post.comments ? post.comments.length : 0;
      const formattedTime = getRelativeTime(post.created_at);

      // السماح بالتعديل أو الحذف فقط لو كان البوست ليس البوست الافتراضي (id !== 1) ومِلْك للمستخدم الحالي
      const isOwner = currentUsername && Number(post.id) !== 1 && (currentUsername === authorUsername || currentUsername === post.author?.name);
      let ownerActionsHtml = "";
      if (isOwner) {
        ownerActionsHtml = `
          <div class="post-btns-right" style="position: absolute; top: 15px; right: 15px; display: flex; gap: 6px; z-index: 5;">
            <button class="action-btn edit-btn" onclick="openEditPostModal(${post.id})" title="Edit Post">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="action-btn delete-btn" onclick="deletePost(${post.id})" title="Delete Post">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        `;
      }

      allPostsHTML += `
      <div class="post-card" data-post-id="${post.id}" style="position: relative;">
        ${ownerActionsHtml}
        
        <div class="post-author" style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; ${isOwner ? 'padding-right: 70px;' : ''}">
          <img src="${authorImage}" class="author-avatar" style="width: 45px; height: 45px; border-radius: 50%; object-fit: cover; cursor: pointer;" onclick="goToUserProfile('${authorUsername}')" title="View Profile" />
          <div class="author-info" style="display: flex; flex-direction: column; justify-content: center;">
            <h4 class="author-name" style="margin: 0; font-size: 16px; font-weight: 600; line-height: 1.2; cursor: pointer;" onclick="goToUserProfile('${authorUsername}')" title="View Profile">${authorName}</h4>
            <span class="post-time" style="margin-top: 3px; font-size: 12px; opacity: 0.7; line-height: 1;">${formattedTime}</span>
          </div>
        </div>

        <div class="post-texts">
          <h3>${post.title || ""}</h3>
          <p>${post.body || ""}</p>
        </div>

        ${imageHtml}
        ${tagsHtml}

        <div class="post-btns">
          <div class="post-btns-left" style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="action-btn like-btn" onclick="toggleLike(${post.id})" style="display: flex; align-items: center; gap: 6px; transition: transform 0.2s ease;">
              <i class="${heartIconClass} fa-heart" style="transition: all 0.3s ease;"></i> 
              <span class="count" style="transition: all 0.3s ease;">${likesCount}</span>
            </button>
            <button class="action-btn save-btn" onclick="toggleSavePost(${post.id})" style="display: flex; align-items: center; gap: 6px; transition: transform 0.2s ease;">
              <i class="${saveIconClass} fa-bookmark" style="transition: all 0.3s ease;"></i>
              <span class="count" style="transition: all 0.3s ease;">${savesCount}</span>
            </button>
            <button class="action-btn share-btn" onclick="sharePost(${post.id})">
              <i class="fa-solid fa-share-nodes"></i>
            </button>
            <button class="action-btn comment-btn" onclick="openCommentsModal(${post.id})" style="display: flex; align-items: center; gap: 6px;">
              <i class="fa-regular fa-comment"></i> <span class="count">${commentsCount}</span>
            </button>
          </div>
        </div>
      </div>`;
    });
  }

  if (typeof DOM !== 'undefined' && DOM.postsContainer) {
    DOM.postsContainer.innerHTML = allPostsHTML;
  } else {
    const container = document.getElementById("postsContainer");
    if (container) container.innerHTML = allPostsHTML;
  }
}

// Delete Post Function
window.deletePost = function(postId) {
  if (Number(postId) === 1) {
    showToast("You cannot delete the welcome post!", "error");
    return;
  }
  if (!confirm("Are you sure you want to delete this post?")) return;
  
  let posts = JSON.parse(localStorage.getItem("moka_posts")) || [];
  posts = posts.filter(p => Number(p.id) !== Number(postId));
  localStorage.setItem("moka_posts", JSON.stringify(posts));
  
  showToast("Post deleted successfully!", "success");
  fetchingPosts(typeof DOM !== 'undefined' && DOM.searchInput ? DOM.searchInput.value : "", state.activeTagFilter);
};

window.filterByTag = function(tagName) {
  state.activeTagFilter = tagName;
  fetchingPosts(typeof DOM !== 'undefined' && DOM.searchInput ? DOM.searchInput.value : "", tagName);
};

window.clearTagFilter = function() {
  state.activeTagFilter = null;
  fetchingPosts(typeof DOM !== 'undefined' && DOM.searchInput ? DOM.searchInput.value : "", null);
};

window.toggleLike = function(postId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showToast("Please login to like posts!", "error");
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("user"));
  let posts = JSON.parse(localStorage.getItem("moka_posts")) || [];
  
  const post = posts.find(p => Number(p.id) === Number(postId));
  if (!post) return;

  if (!post.likes) post.likes = [];

  const userIndex = post.likes.indexOf(currentUser.username);
  const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
  const likeBtnIcon = postCard?.querySelector(".like-btn i");
  const likeCountSpan = postCard?.querySelector(".like-btn .count");

  if (postCard) {
    const btn = postCard.querySelector(".like-btn");
    btn.style.transform = "scale(1.2)";
    setTimeout(() => btn.style.transform = "scale(1)", 200);
  }

  if (userIndex > -1) {
    post.likes.splice(userIndex, 1);
    if (likeBtnIcon) likeBtnIcon.className = "fa-regular fa-heart";
  } else {
    post.likes.push(currentUser.username);
    if (likeBtnIcon) {
      likeBtnIcon.className = "fa-solid fa-heart text-danger";
      likeBtnIcon.style.transform = "scale(1.3)";
      setTimeout(() => likeBtnIcon.style.transform = "scale(1)", 300);
    }
  }

  if (likeCountSpan) likeCountSpan.textContent = post.likes.length;
  localStorage.setItem("moka_posts", JSON.stringify(posts));
};

window.toggleSavePost = function(postId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showToast("Please login to save posts!", "error");
    return;
  }

  const currentUser = JSON.parse(localStorage.getItem("user"));
  let posts = JSON.parse(localStorage.getItem("moka_posts")) || [];
  const post = posts.find(p => Number(p.id) === Number(postId));
  if (!post) return;

  if (!post.saves) post.saves = [];

  const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
  const saveBtn = postCard?.querySelector(".save-btn");
  const saveIcon = saveBtn?.querySelector("i");
  const saveCountSpan = saveBtn?.querySelector(".count");

  if (saveBtn) {
    saveBtn.style.transform = "scale(1.2)";
    setTimeout(() => saveBtn.style.transform = "scale(1)", 200);
  }

  const userIndex = post.saves.indexOf(currentUser.username);

  if (userIndex > -1) {
    post.saves.splice(userIndex, 1);
    if (saveIcon) saveIcon.className = "fa-regular fa-bookmark";
    showToast("Post removed from saved items", "success");
  } else {
    post.saves.push(currentUser.username);
    if (saveIcon) {
      saveIcon.className = "fa-solid fa-bookmark text-warning";
      saveIcon.style.transform = "scale(1.3)";
      setTimeout(() => saveIcon.style.transform = "scale(1)", 300);
    }
    showToast("Post saved successfully! 📌", "success");
  }

  if (saveCountSpan) saveCountSpan.textContent = post.saves.length;
  localStorage.setItem("moka_posts", JSON.stringify(posts));

  let userSavedPosts = JSON.parse(localStorage.getItem(`saved_posts_${currentUser.username}`)) || [];
  if (userIndex > -1) {
    userSavedPosts = userSavedPosts.filter(id => Number(id) !== Number(postId));
  } else {
    if (!userSavedPosts.includes(postId)) userSavedPosts.push(postId);
  }
  localStorage.setItem(`saved_posts_${currentUser.username}`, JSON.stringify(userSavedPosts));
};

window.sharePost = async function(postId) {
  let posts = JSON.parse(localStorage.getItem("moka_posts")) || [];
  const post = posts.find(p => Number(p.id) === Number(postId));
  
  const shareData = {
    title: post ? post.title : "Moka Cafe Post",
    text: post ? post.body.substring(0, 100) + "..." : "Check out this post on Moka Cafe",
    url: window.location.href.split('#')[0] + `#post-${postId}`
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      showToast("Post link copied to clipboard! 🔗", "success");
    }
  } catch (err) {
    if (err.name !== 'AbortError') showToast("Failed to share post", "error");
  }
};
