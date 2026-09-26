// ==========================================
// COMMENTS SYSTEM MANAGEMENT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  initCommentsModal();
});

// Helper function to calculate elapsed time (2m ago, 1h ago, etc.)
function timeAgo(dateParam) {
  if (!dateParam) return "Just now";
  const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initCommentsModal() {
  if (document.getElementById("customCommentsModal")) return;

  const commentsModalHTML = `
    <div id="customCommentsModal" style="display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:#121212; z-index:99999; flex-direction: column; overflow: hidden; animation: fadeInModal 0.25s ease;">
      <div style="padding: 16px 20px; background: #1a1a1a; border-bottom: 1px solid #2a2a2a; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <button onclick="closeCommentsModal()" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; padding: 4px 8px;"><i class="fa-solid fa-arrow-left"></i></button>
          <h5 style="margin: 0; font-size: 17px; font-weight: 600; color: #fff;">Comments</h5>
        </div>
        <span id="commentsCountHeader" style="font-size: 13px; color: #aaa;">0 comments</span>
      </div>

      <div id="commentsListContainer" style="padding: 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 16px; max-width: 800px; width: 100%; margin: 0 auto;"></div>

      <div style="padding: 14px 20px; background: #1a1a1a; border-top: 1px solid #2a2a2a; display: flex; gap: 12px; align-items: center; width: 100%;">
        <div style="max-width: 800px; width: 100%; margin: 0 auto; display: flex; gap: 10px;">
          <input type="text" id="commentInputText" placeholder="Write a comment..." style="flex: 1; background: #252525; border: 1px solid #3d3d3d; border-radius: 24px; padding: 12px 18px; color: #fff; outline: none; font-size: 14px;" />
          <button id="submitCommentBtn" style="background: #9333ea; color: white; border: none; width: 45px; height: 45px; border-radius: 50%; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer;"><i class="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', commentsModalHTML);

  const styleAnim = document.createElement('style');
  styleAnim.innerHTML = `@keyframes fadeInModal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }`;
  document.head.appendChild(styleAnim);

  const submitBtn = document.getElementById("submitCommentBtn");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const token = localStorage.getItem("token");
      if (!token) {
        showToast("Please login to comment!", "error");
        return;
      }

      const modal = document.getElementById("customCommentsModal");
      const postId = modal ? modal.dataset.currentPostId : null;
      const input = document.getElementById("commentInputText");
      const commentText = input ? input.value.trim() : "";

      if (!postId || !commentText) return;

      const currentUser = JSON.parse(localStorage.getItem("user")) || { name: "User", profile_image: "https://via.placeholder.com/40" };
      let posts = JSON.parse(localStorage.getItem("moka_posts")) || [];
      
      const postIndex = posts.findIndex(p => String(p.id) === String(postId));

      if (postIndex !== -1) {
        if (!posts[postIndex].comments) posts[postIndex].comments = [];
        
        // Store the actual creation timestamp
        posts[postIndex].comments.push({
          id: Date.now(),
          body: commentText,
          author: {
            name: currentUser.name || currentUser.username || "User",
            profile_image: currentUser.profile_image || "https://via.placeholder.com/40"
          },
          created_at: new Date().toISOString()
        });
        
        try {
          localStorage.setItem("moka_posts", JSON.stringify(posts));
        } catch (e) {
          showToast("Storage is full! Cannot save comment.", "error");
          return;
        }

        input.value = "";
        renderCommentsList(posts[postIndex]);
        
        const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (postCard) {
          const commentCountSpan = postCard.querySelector(".comment-btn .count");
          if (commentCountSpan) commentCountSpan.textContent = posts[postIndex].comments.length;
        }
        
        showToast("Comment posted successfully! 💬", "success");
      } else {
        showToast("Post not found!", "error");
      }
    });
  }
}

window.openCommentsModal = function(postId) {
  const token = localStorage.getItem("token");
  if (!token) {
    showToast("Please login first to view and write comments!", "error");
    return;
  }

  initCommentsModal();

  let posts = JSON.parse(localStorage.getItem("moka_posts")) || [];
  const post = posts.find(p => String(p.id) === String(postId));
  if (!post) return;

  const modal = document.getElementById("customCommentsModal");
  if (modal) {
    modal.dataset.currentPostId = postId;
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
    renderCommentsList(post);
  }
};

window.closeCommentsModal = function() {
  const modal = document.getElementById("customCommentsModal");
  if (modal) {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }
};

function renderCommentsList(post) {
  const container = document.getElementById("commentsListContainer");
  const countHeader = document.getElementById("commentsCountHeader");
  if (!container) return;

  const count = post.comments ? post.comments.length : 0;
  if (countHeader) countHeader.textContent = `${count} comment${count === 1 ? '' : 's'}`;

  if (!post.comments || count === 0) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #777; gap: 10px; margin-top: 50px;">
        <i class="fa-regular fa-comment-dots" style="font-size: 40px; opacity: 0.5;"></i>
        <p style="margin: 0; font-size: 14px;">No comments yet. Start the conversation!</p>
      </div>`;
    return;
  }

  let html = "";
  post.comments.forEach(comment => {
    const displayTime = comment.created_at && !comment.created_at.includes("Just now") && !comment.created_at.includes("ago") 
      ? timeAgo(comment.created_at) 
      : (comment.created_at || "Just now");

    html += `
      <div style="display: flex; gap: 12px; align-items: flex-start; animation: fadeInModal 0.2s ease;">
        <img src="${comment.author?.profile_image || "https://via.placeholder.com/40"}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;" />
        <div style="background: #1a1a1a; padding: 10px 14px; border-radius: 12px; flex: 1; border: 1px solid #252525;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 13px; font-weight: 600; color: #e2e2e2;">${comment.author?.name || "User"}</span>
            <span style="font-size: 11px; color: #777;">${displayTime}</span>
          </div>
          <p style="margin: 0; font-size: 14px; color: #ccc; word-break: break-word; line-height: 1.4;">${comment.body}</p>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}
