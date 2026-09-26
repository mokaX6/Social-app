// Toast Notification helper
function showToast(message, type = "success") {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 9999; display: flex; flex-direction: column; gap: 10px;";
    document.body.appendChild(toastContainer);
  }
  const toast = document.createElement("div");
  toast.style.cssText = `background: ${type === 'error' ? '#ef4444' : '#10b981'}; color: white; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.3); transition: opacity 0.3s;`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Compress image helper for avatar
function compressImage(file, maxWidth, maxHeight, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = event => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
}

let activeEditField = null;

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Please login first to access settings!");
    window.location.href = "../index.html";
    return;
  }
  loadSettingsData();

  // Avatar file change listener
  const avatarFileInput = document.getElementById("avatarFileInput");
  if (avatarFileInput) {
    avatarFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          const compressedAvatar = await compressImage(file, 400, 400, 0.7);
          let currentUser = JSON.parse(localStorage.getItem("user")) || {};
          currentUser.profile_image = compressedAvatar;
          localStorage.setItem("user", JSON.stringify(currentUser));

          updateUserInStorage(currentUser);

          document.getElementById("settingsAvatarImg").src = compressedAvatar;
          showToast("Profile picture updated successfully! 🖼️", "success");
          if (typeof checkAuthUI === 'function') checkAuthUI();
        } catch (err) {
          showToast("Failed to process image", "error");
        }
      }
    });
  }
});

function loadSettingsData() {
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  document.getElementById("settingsAvatarImg").src = currentUser.profile_image || "../files/vergil.jpg";
  document.getElementById("settingsDisplayName").textContent = currentUser.name || currentUser.username || "User";
  
  const usernameValElem = document.getElementById("settingsUsernameVal");
  if (usernameValElem) usernameValElem.textContent = "@" + (currentUser.username || "");

  const bioValElem = document.getElementById("settingsBioVal");
  if (currentUser.bio) {
    bioValElem.textContent = currentUser.bio;
    bioValElem.classList.remove("text-muted");
  } else {
    bioValElem.textContent = "No bio added yet.";
    bioValElem.classList.add("text-muted");
  }

  const emailValElem = document.getElementById("settingsEmailVal");
  if (currentUser.email) {
    emailValElem.textContent = currentUser.email;
    emailValElem.classList.remove("text-muted");
  } else {
    emailValElem.textContent = "No email added";
    emailValElem.classList.add("text-muted");
  }
}

function updateUserInStorage(updatedUser) {
  localStorage.setItem("user", JSON.stringify(updatedUser));
  
  let users = JSON.parse(localStorage.getItem("moka_users")) || [];
  const index = users.findIndex(u => u.username === updatedUser.oldUsername || u.username === updatedUser.username);
  if (index !== -1) {
    users[index] = updatedUser;
    localStorage.setItem("moka_users", JSON.stringify(users));
  }
}

// Modal Field Editing Handlers
function openEditFieldModal(fieldKey, fieldLabel) {
  activeEditField = fieldKey;
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};
  
  document.getElementById("editModalTitle").textContent = "Edit " + fieldLabel;
  const inputElem = document.getElementById("editFieldInput");
  
  if (fieldKey === 'name') inputElem.value = currentUser.name || "";
  else if (fieldKey === 'username') inputElem.value = currentUser.username || "";
  else if (fieldKey === 'bio') inputElem.value = currentUser.bio || "";
  else if (fieldKey === 'email') inputElem.value = currentUser.email || "";

  document.getElementById("editFieldModal").style.display = "flex";
}

function closeEditFieldModal() {
  document.getElementById("editFieldModal").style.display = "none";
  activeEditField = null;
}

function saveFieldChanges() {
  const newValue = document.getElementById("editFieldInput").value.trim();
  if (!newValue && activeEditField !== 'bio' && activeEditField !== 'email') {
    showToast("Field cannot be empty!", "error");
    return;
  }

  let currentUser = JSON.parse(localStorage.getItem("user")) || {};
  currentUser.oldUsername = currentUser.username;

  if (activeEditField === 'name') currentUser.name = newValue;
  else if (activeEditField === 'username') {
    let users = JSON.parse(localStorage.getItem("moka_users")) || [];
    if (users.some(u => u.username === newValue && u.username !== currentUser.username)) {
      showToast("Username already taken!", "error");
      return;
    }
    currentUser.username = newValue;
  }
  else if (activeEditField === 'bio') currentUser.bio = newValue;
  else if (activeEditField === 'email') currentUser.email = newValue;

  updateUserInStorage(currentUser);
  loadSettingsData();
  if (typeof checkAuthUI === 'function') checkAuthUI();
  
  closeEditFieldModal();
  showToast("Updated successfully! ✨", "success");
}

// Password Verification Flow
function openPasswordVerificationModal() {
  document.getElementById("verifyCurrentPasswordInput").value = "";
  document.getElementById("passwordVerifyModal").style.display = "flex";
}

function closeVerifyModal() {
  document.getElementById("passwordVerifyModal").style.display = "none";
}

function verifyPasswordAction() {
  const enteredPassword = document.getElementById("verifyCurrentPasswordInput").value;
  const currentUser = JSON.parse(localStorage.getItem("user")) || {};

  if (enteredPassword === currentUser.password) {
    closeVerifyModal();
    document.getElementById("displayCurrentPasswordBox").value = currentUser.password;
    document.getElementById("newPasswordInputBox").value = "";
    document.getElementById("passwordChangeModal").style.display = "flex";
  } else {
    showToast("Incorrect password! Please try again.", "error");
  }
}

function closePasswordChangeModal() {
  document.getElementById("passwordChangeModal").style.display = "none";
}

function saveNewPasswordAction() {
  const newPassword = document.getElementById("newPasswordInputBox").value.trim();
  if (!newPassword) {
    showToast("Please enter a new password!", "error");
    return;
  }

  let currentUser = JSON.parse(localStorage.getItem("user")) || {};
  currentUser.password = newPassword;

  updateUserInStorage(currentUser);
  
  closePasswordChangeModal();
  showToast("Password updated successfully! 🔒", "success");
}
