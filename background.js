chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH_PROFILE') {
        fetchProfileData(request.username)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (request.type === 'FETCH_STORIES') {
        fetchStories(request.userId)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (request.type === 'FETCH_HIGHLIGHTS_TRAY') {
        fetchHighlightsTray(request.userId)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (request.type === 'FETCH_FOLLOWERS') {
        fetchFollowers(request.userId, request.maxId)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (request.type === 'FETCH_FOLLOWING') {
        fetchFollowing(request.userId, request.maxId)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (request.type === 'FETCH_REELS') {
        fetchReels(request.userId, request.maxId)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    } else if (request.type === 'FETCH_USER_FEED') {
        fetchUserFeed(request.username, request.maxId)
            .then(data => sendResponse({ success: true, data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function fetchProfileData(username) {
    try {
        const headers = {
            'x-ig-app-id': '936619743392459',
            'Accept': '*/*, application/json',
            'User-Agent': navigator.userAgent,
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://www.instagram.com/',
            'X-ASBD-ID': '198387'
        };

        const res = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
            headers,
            credentials: 'include'
        });

        if (res.ok) {
            const data = await res.json();
            if (data && data.data && data.data.user) {
                return data.data.user;
            }
        }

        // HTML Scraping Fallback
        let html = '';
        try {
            const htmlRes = await fetch(`https://www.instagram.com/${username}/`, {
                headers: { 'User-Agent': navigator.userAgent },
                credentials: 'include'
            });

            if (!htmlRes.ok) {
                if (htmlRes.status === 404) throw new Error('Kullanıcı bulunamadı.');
                throw new Error('Authenticated request blocked.');
            }
            html = await htmlRes.text();
        } catch (e) {
            console.warn("Authenticated HTML fetch failed...", e);
        }

        // Standard Metas
        const nameMatch = html.match(/<meta property="og:title" content="([^"]+)"/);
        const descMatch = html.match(/<meta property="og:description" content="([^"]+)"/);
        const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);

        // Attempt to find user ID in page source
        const idMatch = html.match(/"user_id":"(\d+)"/) ||
            html.match(/"id":"(\d+)"/) ||
            html.match(/"owner":\s*{"id":"(\d+)"/) ||
            html.match(/"profilePage_(\d+)"/) ||
            html.match(/"viewerId":"(\d+)"/) ||
            html.match(/"pk":"?(\d+)"?/) ||
            html.match(/"extra_user_id":"(\d+)"/);
        const userId = idMatch ? (idMatch[1] || idMatch[2] || idMatch[3] || idMatch[4] || idMatch[5] || idMatch[6] || idMatch[7]) : null;

        // Attempt to find JSON data in page source
        let userData = null;
        try {
            const jsonMatch = html.match(/<script[^>]*>\s*window\._sharedData\s*=\s*({.+?});\s*<\/script>/) ||
                html.match(/<script[^>]*type="application\/json"[^>]*data-purpose="fna"[^>]*>\s*({.+?})\s*<\/script>/) ||
                html.match(/<script[^>]*type="application\/json"[^>]*>\s*({.+?})\s*<\/script>/);

            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                const entryData = parsed.entry_data?.ProfilePage?.[0]?.graphql?.user ||
                    parsed.require?.[0]?.[3]?.[0]?.__bbox?.result?.data?.user;
                if (entryData) userData = entryData;
            }
        } catch (e) {
            console.warn("JSON Fallback parse error", e);
        }

        if (userData) return userData;

        if (!nameMatch || !descMatch || !imageMatch) {
            // Final Fallback: Attempt API anonymously (bypasses 404 for blocked accounts, relies on residential IP)
            try {
                const anonApiRes = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
                    headers: {
                        'x-ig-app-id': '936619743392459',
                        'User-Agent': navigator.userAgent,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    credentials: 'omit'
                });
                if (anonApiRes.ok) {
                    const anonData = await anonApiRes.json();
                    if (anonData && anonData.data && anonData.data.user) {
                        return anonData.data.user;
                    }
                }
            } catch (e) {
                console.warn("Anonymous API fetch failed", e);
            }
            throw new Error('Profil bilgileri çözümlenemedi. Gizli profil, limit aşımı veya engellenmiş hesap.');
        }

        let fullName = username;
        if (nameMatch[1]) {
            fullName = nameMatch[1].split('(@')[0].trim();
        }

        let imageUrl = imageMatch[1].replace(/&amp;/g, '&');
        const descStr = descMatch[1];
        const statsMatch = descStr.match(/([\d\.,]+(?:[KMB])?)\s+Followers,\s+([\d\.,]+(?:[KMB])?)\s+Following,\s+([\d\.,]+(?:[KMB])?)\s+Posts/i);

        const isPrivateMatch = html.match(/"is_private":\s*(true|false)/);
        const followedMatch = html.match(/"followed_by_viewer":\s*(true|false)/);

        return {
            id: userId,
            username: username,
            full_name: fullName,
            profile_pic_url: imageUrl,
            is_private: isPrivateMatch ? isPrivateMatch[1] === 'true' : false,
            followed_by_viewer: followedMatch ? followedMatch[1] === 'true' : false,
            is_verified: false,
            edge_followed_by: { count: statsMatch ? statsMatch[1].replace(/,/g, '') : 0 },
            edge_follow: { count: statsMatch ? statsMatch[2].replace(/,/g, '') : 0 },
            edge_owner_to_timeline_media: { count: statsMatch ? statsMatch[3].replace(/,/g, '') : 0, edges: [] },
            biography: descStr.split(') -')[1]?.trim() || ''
        };
    } catch (err) {
        throw err;
    }
}

async function fetchStories(userId) {
    try {
        const res = await fetch(`https://i.instagram.com/api/v1/feed/reels_media/?reel_ids=${userId}`, {
            headers: {
                'x-ig-app-id': '936619743392459',
                'Accept': '*/*, application/json',
                'User-Agent': navigator.userAgent
            },
            credentials: 'include' // Force Chrome to send session cookies to Instagram CDN
        });

        if (!res.ok) {
            throw new Error('Stories unavailable or private.');
        }

        const data = await res.json();
        // The API returns the data keyed by the exact ID passed, e.g., userId or "highlight:1234"
        if (data && data.reels && data.reels[userId]) {
            return data.reels[userId];
        }
        return null; // No stories
    } catch (err) {
        throw err;
    }
}

async function fetchHighlightsTray(userId) {
    try {
        const res = await fetch(`https://i.instagram.com/api/v1/highlights/${userId}/highlights_tray/`, {
            headers: {
                'x-ig-app-id': '936619743392459',
                'Accept': '*/*, application/json',
                'User-Agent': navigator.userAgent
            },
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('Highlights unavailable or private.');
        }

        const data = await res.json();
        if (data && data.tray) {
            return data.tray;
        }
        return []; // No highlights
    } catch (err) {
        throw err;
    }
}

async function fetchFollowers(userId, maxId = '') {
    try {
        const url = `https://www.instagram.com/api/v1/friendships/${userId}/followers/?count=50&max_id=${maxId}`;
        const res = await fetch(url, {
            headers: {
                'x-ig-app-id': '936619743392459',
                'Accept': '*/*, application/json',
                'User-Agent': navigator.userAgent
            },
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Followers unavailable or private.');

        const data = await res.json();
        return {
            users: data.users || [],
            next_max_id: data.next_max_id || null
        };
    } catch (err) {
        throw err;
    }
}

async function fetchFollowing(userId, maxId = '') {
    try {
        const url = `https://www.instagram.com/api/v1/friendships/${userId}/following/?count=50&max_id=${maxId}`;
        const res = await fetch(url, {
            headers: {
                'x-ig-app-id': '936619743392459',
                'Accept': '*/*, application/json',
                'User-Agent': navigator.userAgent
            },
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Following unavailable or private.');

        const data = await res.json();
        return {
            users: data.users || [],
            next_max_id: data.next_max_id || null
        };
    } catch (err) {
        throw err;
    }
}

async function fetchUserFeed(username, maxId = '') {
    try {
        const url = `https://www.instagram.com/api/v1/feed/user/${username}/username/?max_id=${maxId}`;
        const res = await fetch(url, {
            headers: {
                'x-ig-app-id': '936619743392459',
                'Accept': '*/*, application/json',
                'User-Agent': navigator.userAgent,
                'X-Requested-With': 'XMLHttpRequest',
                'Referer': `https://www.instagram.com/${username}/`
            },
            credentials: 'include'
        });

        if (!res.ok) return null;
        const data = await res.json();
        if (data && data.items) {
            const items = data.items.map(item => {
                const node = {
                    id: item.id,
                    shortcode: item.code,
                    display_url: item.image_versions2?.candidates?.[0]?.url,
                    thumbnail_src: item.image_versions2?.candidates?.[item.image_versions2.candidates.length - 1]?.url,
                    is_video: item.media_type === 2,
                    video_url: item.video_versions?.[0]?.url,
                    edge_media_preview_like: { count: item.like_count },
                    edge_media_to_comment: { count: item.comment_count },
                    edge_media_to_caption: { edges: item.caption ? [{ node: { text: item.caption.text } }] : [] }
                };

                if (item.media_type === 8 && item.carousel_media) {
                    node.edge_sidecar_to_children = {
                        edges: item.carousel_media.map(m => ({
                            node: {
                                id: m.id,
                                is_video: m.media_type === 2,
                                video_url: m.video_versions?.[0]?.url,
                                display_url: m.image_versions2?.candidates?.[0]?.url
                            }
                        }))
                    };
                }
                return { node };
            });
            return { items, next_max_id: data.next_max_id || null };
        }
        return { items: [], next_max_id: null };
    } catch (e) {
        console.error("Fetch feed error", e);
        return { items: [], next_max_id: null };
    }
}

async function fetchReels(userId, maxId = '') {
    try {
        let data = null;
        let csrfToken = '';

        try {
            const csrfRes = await fetch('https://www.instagram.com/', { credentials: 'include' });
            const csrfText = await csrfRes.text();
            const csrfMatch = csrfText.match(/"csrf_token":"([^"]+)"/);
            if (csrfMatch) csrfToken = csrfMatch[1];
        } catch (e) {
            console.warn("Could not extract CSRF token", e);
        }

        // Method 1: POST to /clips/user/ (Standard)
        const fetchHeaders = {
            'x-ig-app-id': '936619743392459',
            'Accept': '*/*, application/json',
            'User-Agent': navigator.userAgent,
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        if (csrfToken) {
            fetchHeaders['X-CSRFToken'] = csrfToken;
        }

        const res1 = await fetch(`https://www.instagram.com/api/v1/clips/user/`, {
            method: 'POST',
            headers: fetchHeaders,
            body: `target_user_id=${userId}&max_id=${maxId}`,
            credentials: 'include'
        });
        if (res1.ok) data = await res1.json();

        // Method 2 Fallback: GET to /clips/user_clips/
        if (!data || !data.items || data.items.length === 0) {
            const res2 = await fetch(`https://www.instagram.com/api/v1/clips/user_clips/?target_user_id=${userId}&max_id=${maxId}`, {
                headers: {
                    'x-ig-app-id': '936619743392459',
                    'Accept': '*/*, application/json',
                    'User-Agent': navigator.userAgent,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });
            if (res2.ok) {
                const d2 = await res2.json();
                if (d2 && d2.items && d2.items.length > 0) data = d2;
            }
        }

        // Method 3 Fallback: GET to /clips/user/
        if (!data || !data.items || data.items.length === 0) {
            const res3 = await fetch(`https://www.instagram.com/api/v1/clips/user/?user_id=${userId}&max_id=${maxId}`, {
                headers: {
                    'x-ig-app-id': '936619743392459',
                    'Accept': '*/*, application/json',
                    'User-Agent': navigator.userAgent,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            });
            if (res3.ok) {
                const d3 = await res3.json();
                if (d3 && d3.items && d3.items.length > 0) data = d3;
            }
        }

        if (data && data.items) {
            const items = data.items.map(item => {
                const media = item.media || item;
                return {
                    node: {
                        id: media.id,
                        shortcode: media.code,
                        display_url: media.image_versions2?.candidates?.[0]?.url,
                        thumbnail_src: media.image_versions2?.candidates?.[media.image_versions2.candidates.length - 1]?.url,
                        is_video: true,
                        video_url: media.video_versions?.[0]?.url,
                        edge_media_preview_like: { count: media.like_count },
                        edge_media_to_comment: { count: media.comment_count },
                        edge_media_to_caption: { edges: media.caption ? [{ node: { text: media.caption.text } }] : [] }
                    }
                };
            });

            let nextMaxId = null;
            if (data.paging_info) {
                if (data.paging_info.more_available !== false) {
                    nextMaxId = data.paging_info.max_id;
                }
            } else if (data.next_max_id) {
                nextMaxId = data.next_max_id;
            }

            return { items, next_max_id: nextMaxId };
        }
        return { items: [], next_max_id: null };
    } catch (e) {
        console.error("Fetch reels error", e);
        return { items: [], next_max_id: null };
    }
}
