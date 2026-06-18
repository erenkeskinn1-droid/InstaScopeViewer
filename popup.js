document.addEventListener('DOMContentLoaded', () => {
  const searchinput = document.getElementById('usernameInput');
  const searchBtn = document.getElementById('searchBtn');
  const loading = document.getElementById('loading');
  const errorDiv = document.getElementById('error');
  const errorText = document.getElementById('errorText');
  const errorExternalLink = document.getElementById('errorExternalLink');
  const profileResult = document.getElementById('profileResult');

  // Recent Searches Elements
  const recentSearchesContainer = document.getElementById('recentSearches');
  const recentList = document.getElementById('recentList');
  const clearRecentBtn = document.getElementById('clearRecentBtn');

  // Lightbox Elements
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeLightbox = document.getElementById('closeLightbox');

  // Modal Elements
  const postModal = document.getElementById('postModal');
  const closePostModal = document.getElementById('closePostModal');
  const postModalImg = document.getElementById('postModalImg');
  const postModalVideo = document.getElementById('postModalVideo');
  const postVideoProgressContainer = document.getElementById('postVideoProgressContainer');
  const postVideoProgressBar = document.getElementById('postVideoProgressBar');
  const postLikes = document.getElementById('postLikes');
  const postComments = document.getElementById('postComments');
  const postCaption = document.getElementById('postCaption');
  const postExternalLink = document.getElementById('postExternalLink');

  const storyModal = document.getElementById('storyModal');
  const closeStoryModal = document.getElementById('closeStoryModal');
  const storyModalImg = document.getElementById('storyModalImg');
  const storyModalVideo = document.getElementById('storyModalVideo');
  const storyProgressBarContainer = document.getElementById('storyProgressBarContainer');
  const storyTapLeft = document.getElementById('storyTapLeft');
  const storyTapRight = document.getElementById('storyTapRight');
  const storyUserAvatar = document.getElementById('storyUserAvatar');
  const storyUsernameEl = document.getElementById('storyUsername');
  const storyTimeEl = document.getElementById('storyTime');

  let currentStories = [];
  let currentStoryIndex = 0;
  let currentHighlights = [];
  let currentHighlightIndex = -1;
  let storyTimeout;
  let storyStartTime = 0;
  let storyElapsedTime = 0;
  let isStoryPaused = false;

  // Result Elements
  const avatarContainer = document.querySelector('.avatar-container');
  const avatar = document.getElementById('avatar');
  const fullName = document.getElementById('fullName');
  const usernameEl = document.getElementById('username');
  const verifiedBadge = document.getElementById('verifiedBadge');
  const privateBadge = document.getElementById('privateBadge');
  const postsCount = document.getElementById('postsCount');
  const followersCount = document.getElementById('followersCount');
  const followingCount = document.getElementById('followingCount');
  const bioSection = document.querySelector('.bio-section');
  const bioText = document.getElementById('bioText');
  const externalLink = document.getElementById('externalLink');
  const viewOnIg = document.getElementById('viewOnIg');
  const actionButtons = document.querySelector('.action-buttons');
  const storyLoading = document.getElementById('storyLoading');
  const postsSection = document.getElementById('postsSection');
  const postsGrid = document.getElementById('postsGrid');
  const highlightsSection = document.getElementById('highlightsSection');
  const highlightsList = document.getElementById('highlightsList');

  // Friends Modal Elements
  const friendsModal = document.getElementById('friendsModal');
  const friendsModalTitle = document.getElementById('friendsModalTitle');
  const closeFriendsModal = document.getElementById('closeFriendsModal');
  const friendsLoading = document.getElementById('friendsLoading');
  const friendsListContainer = document.getElementById('friendsListContainer');

  // Tabs Elements
  const tabPosts = document.getElementById('tabPosts');
  const tabReels = document.getElementById('tabReels');
  const emptyPostsState = document.getElementById('emptyPostsState');
  const loadMoreContainer = document.getElementById('loadMoreContainer');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const friendsLoadMoreContainer = document.getElementById('friendsLoadMoreContainer');
  const friendsLoadMoreBtn = document.getElementById('friendsLoadMoreBtn');

  const prevMediaBtn = document.getElementById('prevMediaBtn');
  const nextMediaBtn = document.getElementById('nextMediaBtn');
  const carouselDots = document.getElementById('carouselDots');

  let currentTimelineEdges = [];
  let currentReelsEdges = [];
  let currentCarouselMedia = [];
  let currentCarouselIndex = 0;

  let postsNextMaxId = null;
  let reelsNextMaxId = null;
  let friendsNextMaxId = null;
  let currentTab = 'posts';
  let currentFriendsType = null;
  let currentFriendsUserId = null;
  let isFetchingMore = false;
  let isFetchingFriendsMore = false;

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTimeAgo = (timestamp) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) return `${Math.max(1, diffInSeconds)}s`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w`;
  };

  const showToast = (msg) => {
    const toastContainer = document.getElementById('toastContainer');
    const toastText = document.getElementById('toastText');
    if(toastContainer && toastText) {
      toastText.textContent = msg;
      toastContainer.classList.add('show');
      setTimeout(() => {
        toastContainer.classList.remove('show');
      }, 3000);
    }
  };

  const showError = (msg, username = null) => {
    showToast(msg);
    errorText.textContent = msg;
    if (msg.includes('Gizli profil, limit aşımı veya engellenmiş hesap') && username) {
      errorExternalLink.href = `https://www.picuki.com/profile/${username}`;
      errorExternalLink.classList.remove('hidden');
    } else {
      errorExternalLink.classList.add('hidden');
    }
    errorDiv.classList.remove('hidden');
    profileResult.classList.add('hidden');
    postsSection.classList.add('hidden');
    highlightsSection.classList.add('hidden');
    if (typeof actionButtons !== 'undefined') actionButtons.classList.add('hidden');
    loading.classList.add('hidden');
    recentSearchesContainer.classList.add('hidden');
  };

  // Auto-focus and auto-select
  searchinput.focus();
  searchinput.addEventListener('click', () => {
    searchinput.select();
  });

  let recentArr = [];

  // Load recents on startup
  chrome.storage.local.get(['instaview_recents'], (result) => {
    if (result.instaview_recents && result.instaview_recents.length > 0) {
      recentArr = result.instaview_recents;
      renderRecents();
    }
  });

  const renderRecents = () => {
    if (recentArr.length === 0) {
      recentSearchesContainer.classList.add('hidden');
      return;
    }

    recentList.innerHTML = '';
    recentArr.forEach(item => {
      const div = document.createElement('div');
      div.className = 'recent-item';

      const img = document.createElement('img');
      img.className = 'recent-avatar';
      img.src = item.avatar || 'icon128.png';

      const span = document.createElement('span');
      span.textContent = item.username;

      const removeBtn = document.createElement('span');
      removeBtn.innerHTML = '&times;';
      removeBtn.className = 'recent-remove-btn';
      removeBtn.title = 'Kaldır';

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent div click
        recentArr = recentArr.filter(r => r.username !== item.username);
        chrome.storage.local.set({ instaview_recents: recentArr });
        renderRecents();
      });

      div.appendChild(img);
      div.appendChild(span);
      div.appendChild(removeBtn);

      div.addEventListener('click', () => {
        searchinput.value = item.username;
        fetchProfile(item.username);
      });

      recentList.appendChild(div);
    });

    recentSearchesContainer.classList.remove('hidden');
  };

  clearRecentBtn.addEventListener('click', () => {
    recentArr = [];
    chrome.storage.local.set({ instaview_recents: [] });
    renderRecents();
  });

  const saveRecent = (username, avatarBase64) => {
    // Remove if already exists
    recentArr = recentArr.filter(item => item.username !== username);
    // Add to front
    recentArr.unshift({ username, avatar: avatarBase64 });
    // Keep max 5
    if (recentArr.length > 5) {
      recentArr.pop();
    }
    chrome.storage.local.set({ instaview_recents: recentArr });
  };

  const loadImgUrl = async (url, imgElement, fallbackIcon = 'icon128.png') => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        imgElement.src = reader.result;
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      imgElement.src = fallbackIcon;
    }
  };

  // Lightbox Listeners
  avatar.addEventListener('click', () => {
    if (avatar.src && !avatar.src.includes('icon128.png')) {
      lightboxImg.src = avatar.src;
      lightbox.classList.remove('hidden');
    }
  });

  closeLightbox.addEventListener('click', () => {
    lightbox.classList.add('hidden');
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.add('hidden');
    }
  });

  // Modal Listeners
  const closeModal = (modal) => {
    modal.classList.add('hidden');
    // Stop any playing video
    const video = modal.querySelector('video');
    if (video) {
      video.pause();
      video.removeAttribute('src');
    }
    // Stop story timeout
    if (modal === storyModal) {
      clearTimeout(storyTimeout);
      storyProgressBarContainer.innerHTML = '';
    }
  };

  closePostModal.addEventListener('click', () => closeModal(postModal));
  postModal.addEventListener('click', (e) => {
    if (e.target === postModal) closeModal(postModal);
  });

  // Custom Video Controls
  postModalVideo.addEventListener('click', () => {
    if (postModalVideo.paused) {
      postModalVideo.play();
    } else {
      postModalVideo.pause();
    }
  });

  postModalVideo.addEventListener('timeupdate', () => {
    if (postModalVideo.duration) {
      const percentage = (postModalVideo.currentTime / postModalVideo.duration) * 100;
      postVideoProgressBar.style.width = percentage + '%';
    }
  });

  // Carousel Navigation
  const renderCarouselItem = (index) => {
    currentCarouselIndex = index;
    const item = currentCarouselMedia[index];

    postModalImg.classList.add('hidden');
    postModalVideo.classList.add('hidden');
    postVideoProgressContainer.classList.add('hidden');

    if (item.is_video) {
      postModalVideo.src = item.video_url;
      postModalVideo.classList.remove('hidden');
      postVideoProgressContainer.classList.remove('hidden');
      postModalVideo.play().catch(() => { });
    } else {
      loadImgUrl(item.display_url, postModalImg);
      postModalImg.classList.remove('hidden');
    }

    // Update buttons
    prevMediaBtn.classList.toggle('hidden', index === 0);
    nextMediaBtn.classList.toggle('hidden', index === currentCarouselMedia.length - 1);

    // Update dots
    const dots = carouselDots.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  };

  prevMediaBtn.onclick = (e) => {
    e.stopPropagation();
    if (currentCarouselIndex > 0) renderCarouselItem(currentCarouselIndex - 1);
  };

  nextMediaBtn.onclick = (e) => {
    e.stopPropagation();
    if (currentCarouselIndex < currentCarouselMedia.length - 1) renderCarouselItem(currentCarouselIndex + 1);
  };

  closeStoryModal.addEventListener('click', () => closeModal(storyModal));
  storyModal.addEventListener('click', (e) => {
    if (e.target === storyModal) closeModal(storyModal);
  });

  closeFriendsModal.addEventListener('click', () => closeModal(friendsModal));
  friendsModal.addEventListener('click', (e) => {
    if (e.target === friendsModal) closeModal(friendsModal);
  });

  // Friends Logic
  const fetchAndRenderFriends = async (type, userId, maxId = '', append = false) => {
    currentFriendsType = type;
    currentFriendsUserId = userId;
    friendsModalTitle.textContent = type === 'followers' ? 'Followers' : 'Following';

    if (!append) {
      friendsListContainer.innerHTML = '';
      friendsLoading.classList.remove('hidden');
    }

    friendsModal.classList.remove('hidden');
    if (!append) {
      friendsLoadMoreContainer.classList.add('hidden');
    }

    try {
      const endpoint = type === 'followers' ? 'FETCH_FOLLOWERS' : 'FETCH_FOLLOWING';
      const r = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: endpoint, userId, maxId }, resolve);
      });

      if (r.success && r.data) {
        const users = r.data.users || [];
        friendsNextMaxId = r.data.next_max_id || null;

        if (users.length === 0 && !append) {
          friendsListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary);">No users found.</p>';
        } else {
          users.forEach(user => {
            const a = document.createElement('a');
            a.className = 'friend-item';
            a.href = `https://www.instagram.com/${user.username}/`;
            a.target = '_blank';

            const img = document.createElement('img');
            img.className = 'friend-avatar';
            if (user.profile_pic_url) {
              loadImgUrl(user.profile_pic_url, img);
            } else {
              img.src = 'icon128.png';
            }

            const info = document.createElement('div');
            info.className = 'friend-info';

            const un = document.createElement('span');
            un.className = 'friend-username';
            un.textContent = user.username;

            const fn = document.createElement('span');
            fn.className = 'friend-fullname';
            fn.textContent = user.full_name || '';

            info.appendChild(un);
            info.appendChild(fn);
            a.appendChild(img);
            a.appendChild(info);

            friendsListContainer.appendChild(a);
          });
        }

        // Toggle Load More
        friendsLoadMoreContainer.classList.toggle('hidden', !friendsNextMaxId);
      }
    } catch (e) {
      console.error('Could not fetch friends', e);
      if (!append) friendsListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--error);">Failed to load list.</p>';
    } finally {
      friendsLoading.classList.add('hidden');
    }
  };

  friendsLoadMoreBtn.onclick = async () => {
    if (isFetchingFriendsMore || !friendsNextMaxId) return;

    isFetchingFriendsMore = true;
    friendsLoadMoreBtn.innerHTML = '<div class="btn-spinner"></div> Yükleniyor...';
    friendsLoadMoreBtn.disabled = true;

    await fetchAndRenderFriends(currentFriendsType, currentFriendsUserId, friendsNextMaxId, true);

    isFetchingFriendsMore = false;
    friendsLoadMoreBtn.innerHTML = 'Daha Fazla Yükle';
    friendsLoadMoreBtn.disabled = false;
  };

  // Story Logic
  const renderStory = () => {
    if (currentStories.length === 0) return;
    clearTimeout(storyTimeout);

    // Stop any previously playing video to avoid overlapping audio
    storyModalVideo.pause();
    storyModalVideo.removeAttribute('src');

    const item = currentStories[currentStoryIndex];

    // Update progress bars
    storyProgressBarContainer.innerHTML = '';
    currentStories.forEach((_, idx) => {
      const bar = document.createElement('div');
      bar.className = 'story-progress-bar';
      const fill = document.createElement('div');
      fill.className = 'story-progress-fill';

      if (idx < currentStoryIndex) {
        fill.style.width = '100%';
      } else if (idx === currentStoryIndex) {
        fill.style.width = '0%';
        // Animate
        setTimeout(() => { fill.style.width = '100%'; }, 50);
      }
      bar.appendChild(fill);
      storyProgressBarContainer.appendChild(bar);
    });

    storyTimeEl.textContent = getTimeAgo(item.taken_at * 1000);

    storyModalImg.classList.add('hidden');
    storyModalVideo.classList.add('hidden');

    const duration = item.video_duration ? (item.video_duration * 1000) : 5000;

    if (item.video_versions && item.video_versions.length > 0) {
      storyModalVideo.src = item.video_versions[0].url;
      storyModalVideo.classList.remove('hidden');
      storyModalVideo.currentTime = 0;
      const playPromise = storyModalVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Auto-play was interrupted or prevented:", error);
        });
      }
    } else {
      loadImgUrl(item.image_versions2.candidates[0].url, storyModalImg);
      storyModalImg.classList.remove('hidden');
    }

    // Auto advance
    const fills = storyProgressBarContainer.querySelectorAll('.story-progress-fill');
    if (fills[currentStoryIndex]) {
      fills[currentStoryIndex].style.transition = `width ${duration}ms linear`;
    }

    storyTimeout = setTimeout(() => {
      storyTapRight.click();
    }, duration);
  };

  storyTapRight.addEventListener('click', () => {
    if (currentStoryIndex < currentStories.length - 1) {
      currentStoryIndex++;
      renderStory();
    } else {
      if (currentHighlightIndex !== -1 && currentHighlightIndex < currentHighlights.length - 1) {
        currentHighlightIndex++;
        const nextHl = currentHighlights[currentHighlightIndex];
        let realId = nextHl.id;
        if (!realId.startsWith('highlight:')) realId = `highlight:${realId}`;
        const coverUrl = nextHl.cover_media_cropped_thumbnail?.url || nextHl.cover_media?.cropped_image_version?.url || 'icon128.png';
        playStories(realId, coverUrl, nextHl.title);
      } else {
        closeModal(storyModal);
      }
    }
  });

  storyTapLeft.addEventListener('click', () => {
    if (currentStoryIndex > 0) {
      currentStoryIndex--;
      renderStory();
    } else {
      if (currentHighlightIndex > 0) {
        currentHighlightIndex--;
        const prevHl = currentHighlights[currentHighlightIndex];
        let realId = prevHl.id;
        if (!realId.startsWith('highlight:')) realId = `highlight:${realId}`;
        const coverUrl = prevHl.cover_media_cropped_thumbnail?.url || prevHl.cover_media?.cropped_image_version?.url || 'icon128.png';
        playStories(realId, coverUrl, prevHl.title, true);
      }
    }
  });

  // Story Button Click
  const playStories = async (fetchId, customAvatarUrl, customUsername, startFromEnd = false) => {
    storyLoading.classList.remove('hidden');
    storyModal.classList.remove('hidden');

    try {
      const r = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'FETCH_STORIES', userId: fetchId }, resolve);
      });
      if (r.success && r.data && r.data.items && r.data.items.length > 0) {
        currentStories = r.data.items;
        currentStoryIndex = startFromEnd ? (currentStories.length - 1) : 0;
        if (customAvatarUrl.startsWith('http')) {
          loadImgUrl(customAvatarUrl, storyUserAvatar);
        } else {
          storyUserAvatar.src = customAvatarUrl;
        }
        storyUsernameEl.textContent = customUsername;
        renderStory();
      } else {
        closeModal(storyModal);
      }
    } catch (e) {
      console.error('Could not fetch stories', e);
      closeModal(storyModal);
    } finally {
      storyLoading.classList.add('hidden');
    }
  };

  const fetchProfile = async (username) => {
    if (!username) return;

    // Clean username input
    username = username.replace('@', '').trim();
    if (username === '') return;

    // UI State
    errorDiv.classList.add('hidden');
    profileResult.classList.add('hidden');
    postsSection.classList.add('hidden');
    highlightsSection.classList.add('hidden');
    recentSearchesContainer.classList.add('hidden');
    if (typeof actionButtons !== 'undefined') actionButtons.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
      // Articial delay for skeleton animation to be visible
      await new Promise(r => setTimeout(r, 600));

      // Trying the primary endpoint via background script
      const profileReponse = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'FETCH_PROFILE', username }, resolve);
      });

      if (!profileReponse || !profileReponse.success) {
        showError(profileReponse ? profileReponse.error : 'Bilinmeyen bir hata oluştu.', username);
        return;
      }
      const user = profileReponse.data;

      // Fetch Image directly from popup via FileReader
      const imageUrl = user.profile_pic_url_hd || user.profile_pic_url || '';
      if (imageUrl) {
        try {
          const imgRes = await fetch(imageUrl);
          if (!imgRes.ok) throw new Error('Resim HTTP ' + imgRes.status);
          const blob = await imgRes.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            avatar.src = reader.result;
            saveRecent(user.username, reader.result);
          };
          reader.readAsDataURL(blob);
        } catch (e) {
          console.error(e);
          avatar.src = 'icon128.png'; // Fallback
          saveRecent(user.username, '');
        }
      } else {
        avatar.src = 'icon128.png';
        saveRecent(user.username, '');
      }

      // Populate UI
      fullName.textContent = user.full_name || username;
      usernameEl.textContent = `@${user.username}`;

      // Badges
      if (user.is_verified) {
        verifiedBadge.classList.remove('hidden');
      } else {
        verifiedBadge.classList.add('hidden');
      }

      if (user.is_private) {
        privateBadge.classList.remove('hidden');
      } else {
        privateBadge.classList.add('hidden');
      }

      // Stats
      postsCount.textContent = formatNumber(user.edge_owner_to_timeline_media?.count || 0);
      followersCount.textContent = formatNumber(user.edge_followed_by?.count || 0);
      followingCount.textContent = formatNumber(user.edge_follow?.count || 0);

      // Bind Followers / Following interaction
      if (user.is_private && !user.followed_by_viewer) {
        followersCount.parentElement.style.cursor = 'default';
        followersCount.parentElement.onclick = null;
        followingCount.parentElement.style.cursor = 'default';
        followingCount.parentElement.onclick = null;
      } else {
        followersCount.parentElement.style.cursor = 'pointer';
        followersCount.parentElement.onclick = () => fetchAndRenderFriends('followers', user.id);
        followingCount.parentElement.style.cursor = 'pointer';
        followingCount.parentElement.onclick = () => fetchAndRenderFriends('following', user.id);
      }

      // Bio
      const hasLink = !!user.external_url;
      // Strip out completely empty lines and invisible characters
      const processedBio = user.biography
        ? user.biography.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n')
        : '';

      const hasBio = processedBio.length > 0;

      bioText.textContent = processedBio;

      if (hasBio) {
        bioText.classList.remove('hidden');
      } else {
        bioText.classList.add('hidden');
      }

      if (hasLink) {
        externalLink.href = user.external_url;
        externalLink.textContent = user.external_url.replace(/^https?:\/\//, '');
        externalLink.classList.remove('hidden');
      } else {
        externalLink.classList.add('hidden');
      }

      // Hide bio section entirely if empty
      if (!hasBio && !hasLink) {
        bioSection.classList.add('hidden');
      } else {
        bioSection.classList.remove('hidden');
      }

      viewOnIg.href = `https://www.instagram.com/${user.username}/`;
      if (typeof actionButtons !== 'undefined') actionButtons.classList.remove('hidden');

      // Stories Links & Ring
      if (user.id) {
        // Silently fetch to see if stories are actually available right now
        chrome.runtime.sendMessage({ type: 'FETCH_STORIES', userId: user.id }, (r) => {
          if (r && r.success && r.data && r.data.items && r.data.items.length > 0) {
            // Stories Exist
            if (avatarContainer) {
              avatarContainer.classList.add('story-ring');
              avatarContainer.onclick = () => {
                currentHighlightIndex = -1;
                playStories(user.id, avatar.src, user.username);
              };
            }
          } else {
            // No Stories
            if (avatarContainer) {
              avatarContainer.classList.remove('story-ring');
              avatarContainer.onclick = null;
            }
          }
        });
      } else {
        if (avatarContainer) {
          avatarContainer.classList.remove('story-ring');
          avatarContainer.onclick = null;
        }
      }

      // Highlights Rendering
      highlightsList.innerHTML = '';
      if (user.id) {
        try {
          const trayRes = await new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'FETCH_HIGHLIGHTS_TRAY', userId: user.id }, resolve);
          });

          if (trayRes.success && trayRes.data && trayRes.data.length > 0) {
            currentHighlights = trayRes.data;
            // The private API returns `id`, `title`, and `cover_media.cropped_image_version.url`
            trayRes.data.forEach((hl, index) => {
              const a = document.createElement('a');
              a.className = 'highlight-item';

              const coverCont = document.createElement('div');
              coverCont.className = 'highlight-cover-container';

              const img = document.createElement('img');
              img.className = 'highlight-cover';
              const coverUrl = hl.cover_media_cropped_thumbnail?.url || hl.cover_media?.cropped_image_version?.url;

              if (coverUrl) {
                loadImgUrl(coverUrl, img);
              } else {
                img.src = 'icon128.png';
              }

              const title = document.createElement('span');
              title.className = 'highlight-title';
              title.textContent = hl.title;

              coverCont.appendChild(img);
              a.appendChild(coverCont);
              a.appendChild(title);

              a.addEventListener('click', (e) => {
                e.preventDefault();
                currentHighlightIndex = index;
                // The ID format from this endpoint is already "highlight:18..."
                let realId = hl.id;
                if (!realId.startsWith('highlight:')) {
                  realId = `highlight:${realId}`;
                }
                playStories(realId, img.src, hl.title);
              });

              highlightsList.appendChild(a);
            });
            highlightsSection.classList.remove('hidden');
          }
        } catch (e) {
          console.error("Could not fetch highlights tray", e);
        }
      }

      // Render Grid Function
      const renderGrid = (edges, append = false) => {
        if (!append) postsGrid.innerHTML = '';

        if (edges.length === 0 && !append) {
          postsGrid.classList.add('hidden');
          emptyPostsState.classList.remove('hidden');
          loadMoreContainer.classList.add('hidden');
          return;
        }

        postsGrid.classList.remove('hidden');
        emptyPostsState.classList.add('hidden');

        // Check if we should show Load More
        const nextId = currentTab === 'posts' ? postsNextMaxId : reelsNextMaxId;
        loadMoreContainer.classList.toggle('hidden', !nextId);

        edges.forEach(edge => {
          const post = edge.node;
          const a = document.createElement('a');
          a.className = 'post-item';
          a.href = '#';

          a.addEventListener('click', (e) => {
            e.preventDefault();

            // Set Media
            postModalImg.classList.add('hidden');
            postModalVideo.classList.add('hidden');
            postVideoProgressContainer.classList.add('hidden');
            prevMediaBtn.classList.add('hidden');
            nextMediaBtn.classList.add('hidden');
            carouselDots.classList.add('hidden');
            carouselDots.innerHTML = '';

            if (post.edge_sidecar_to_children && post.edge_sidecar_to_children.edges.length > 0) {
              currentCarouselMedia = post.edge_sidecar_to_children.edges.map(edge => edge.node);

              // Setup Dots
              currentCarouselMedia.forEach(() => {
                const dot = document.createElement('div');
                dot.className = 'carousel-dot';
                carouselDots.appendChild(dot);
              });
              carouselDots.classList.remove('hidden');

              renderCarouselItem(0);
            } else {
              currentCarouselMedia = [];
              if (post.is_video && post.video_url) {
                postModalVideo.src = post.video_url;
                postModalVideo.classList.remove('hidden');
                postVideoProgressContainer.classList.remove('hidden');
              } else {
                loadImgUrl(post.display_url || post.thumbnail_src, postModalImg);
                postModalImg.classList.remove('hidden');
              }
            }

            // Set Stats
            postLikes.textContent = formatNumber(post.edge_media_preview_like?.count || post.edge_liked_by?.count || 0);
            postComments.textContent = formatNumber(post.edge_media_to_comment?.count || 0);

            // Set Caption
            const captionEdge = post.edge_media_to_caption?.edges[0];
            postCaption.textContent = captionEdge ? captionEdge.node.text : '';

            // Set Link
            postExternalLink.href = `https://www.instagram.com/p/${post.shortcode}/`;

            postModal.classList.remove('hidden');
          });

          const img = document.createElement('img');
          img.className = 'post-img';
          // Use base64 proxy to prevent CORS blocks on grid thumbnails
          loadImgUrl(post.thumbnail_src || post.display_url, img);

          a.appendChild(img);

          if (post.is_video) {
            const icon = document.createElement('div');
            icon.className = 'post-icon';
            icon.innerHTML = `<svg aria-label="Video" fill="currentColor" height="16" viewBox="0 0 24 24" width="16"><path d="M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.225 7.056a3.462 3.462 0 0 1-1.719.462Z"></path></svg>`;
            a.appendChild(icon);
          } else if (post.edge_sidecar_to_children) {
            const icon = document.createElement('div');
            icon.className = 'post-icon';
            icon.innerHTML = `<svg aria-label="Carousel" fill="currentColor" height="16" viewBox="0 0 24 24" width="16"><path d="M11.5 22.5A10.976 10.976 0 0 1 2.3 8.351a1.002 1.002 0 1 1 1.737.994 8.981 8.981 0 1 0 13.921-9.33 1.001 1.001 0 0 1-.994-1.738 10.979 10.979 0 0 1 4.536 18.2 10.932 10.932 0 0 1-10 6.023Z"></path></svg>`;
            a.appendChild(icon);
          }

          postsGrid.appendChild(a);
        });
      };

      // Extract Timeline and Reels Data
      currentTimelineEdges = user.edge_owner_to_timeline_media?.edges || [];
      currentReelsEdges = (user.edge_felix_video_timeline?.edges || user.edge_clips_video_timeline?.edges || []);
      const hasPostsCount = (user.edge_owner_to_timeline_media?.count || 0) > 0;
      const userId = user.id;

      // Initialize Pagination
      postsNextMaxId = user.edge_owner_to_timeline_media?.page_info?.end_cursor || null;
      reelsNextMaxId = null; // Clips API usually returns its own cursor
      currentTab = 'posts';

      // Robust Fallback: If posts count > 0 but no edges, try fetching the feed specifically
      if (currentTimelineEdges.length === 0 && hasPostsCount) {
        try {
          const feedRes = await new Promise(resolve => chrome.runtime.sendMessage({ type: 'FETCH_USER_FEED', username: user.username }, resolve));
          if (feedRes && feedRes.success && feedRes.data) {
            currentTimelineEdges = feedRes.data.items;
            postsNextMaxId = feedRes.data.next_max_id;
          }
        } catch (e) { console.warn("Feed fallback failed", e); }
      }

      // Initial Render (Posts tab active by default)
      if (currentTimelineEdges.length > 0 || currentReelsEdges.length > 0 || hasPostsCount) {
        postsSection.classList.remove('hidden');
        tabPosts.classList.add('active');
        tabReels.classList.remove('active');
        renderGrid(currentTimelineEdges);
      } else {
        postsSection.classList.add('hidden');
      }

      // Tab Listeners
      tabPosts.onclick = () => {
        currentTab = 'posts';
        tabPosts.classList.add('active');
        tabReels.classList.remove('active');
        renderGrid(currentTimelineEdges);
      };

      tabReels.onclick = async () => {
        currentTab = 'reels';
        tabReels.classList.add('active');
        tabPosts.classList.remove('active');

        // Immediate feedback
        if (currentReelsEdges.length === 0) {
          postsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary); font-size: 14px;">Videolar Aranıyor...</div>';
          emptyPostsState.classList.add('hidden');
          loadMoreContainer.classList.add('hidden');
        } else {
          renderGrid(currentReelsEdges);
          return;
        }

        // Extract fresh userId
        const activeUserId = user.id || currentFriendsUserId;

        // 1. Direct fetch (triple endpoint in background)
        try {
          const reelsRes = await new Promise(resolve => chrome.runtime.sendMessage({ type: 'FETCH_REELS', userId: activeUserId }, resolve));
          if (reelsRes && reelsRes.success && reelsRes.data && reelsRes.data.items && reelsRes.data.items.length > 0) {
            currentReelsEdges = reelsRes.data.items;
            reelsNextMaxId = reelsRes.data.next_max_id;
          }
        } catch (e) { console.warn("Reels direct fetch failed", e); }

        // 2. Fallback: Check Timeline (if already loaded)
        if (currentReelsEdges.length === 0 && currentTimelineEdges.length > 0) {
          const reelsInTimeline = currentTimelineEdges.filter(e => e.node && e.node.is_video);
          if (reelsInTimeline.length > 0) {
            currentReelsEdges = reelsInTimeline;
          }
        }

        // 3. Fallback: Force Timeline/Feed fetch if still empty
        if (currentReelsEdges.length === 0 && user.username) {
          try {
            const feedRes = await new Promise(resolve => chrome.runtime.sendMessage({ type: 'FETCH_USER_FEED', username: user.username }, resolve));
            if (feedRes && feedRes.success && feedRes.data && feedRes.data.items && feedRes.data.items.length > 0) {
              const items = feedRes.data.items.filter(e => e.node && e.node.is_video);
              if (items.length > 0) {
                currentReelsEdges = items;
              }
            }
          } catch (e) { console.warn("Reels deep feed fallback failed", e); }
        }

        // Final UI Update
        renderGrid(currentReelsEdges);
      };

      // Load More Handler
      loadMoreBtn.onclick = async () => {
        if (isFetchingMore) return;
        const currentTargetId = currentTab === 'posts' ? postsNextMaxId : reelsNextMaxId;
        if (!currentTargetId) return;

        isFetchingMore = true;
        loadMoreBtn.innerHTML = '<div class="btn-spinner"></div> Yükleniyor...';
        loadMoreBtn.disabled = true;

        try {
          let response;
          if (currentTab === 'posts') {
            response = await new Promise(resolve => chrome.runtime.sendMessage({
              type: 'FETCH_USER_FEED',
              username: user.username,
              maxId: postsNextMaxId
            }, resolve));
          } else {
            response = await new Promise(resolve => chrome.runtime.sendMessage({
              type: 'FETCH_REELS',
              userId: user.id,
              maxId: reelsNextMaxId
            }, resolve));
          }

          if (response && response.success && response.data) {
            const newItems = response.data.items || [];
            if (currentTab === 'posts') {
              currentTimelineEdges = [...currentTimelineEdges, ...newItems];
              postsNextMaxId = response.data.next_max_id;
            } else {
              currentReelsEdges = [...currentReelsEdges, ...newItems];
              reelsNextMaxId = response.data.next_max_id;
            }
            renderGrid(newItems, true);
          }
        } catch (e) {
          console.error("Load more error", e);
        } finally {
          isFetchingMore = false;
          loadMoreBtn.innerHTML = 'Daha Fazla Yükle';
          loadMoreBtn.disabled = false;

          const nextId = currentTab === 'posts' ? postsNextMaxId : reelsNextMaxId;
          loadMoreContainer.classList.toggle('hidden', !nextId);
        }
      };

      // Show Result
      loading.classList.add('hidden');
      profileResult.classList.remove('hidden');

    } catch (err) {
      console.error(err);
      showError(err.message || 'Error fetching profile. You might need to be logged into Instagram in your Chrome browser.');
    }
  };

  searchBtn.addEventListener('click', () => {
    fetchProfile(searchinput.value);
  });

  searchinput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      fetchProfile(searchinput.value);
    }
  });
});
