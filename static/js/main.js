document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const searchInput = document.getElementById('search-input');
    const feedContainer = document.getElementById('feed-container');
    const detailContainer = document.getElementById('detail-container');
    const selectionStatus = document.getElementById('selection-status');
    
    // Composer Drawer Elements
    const composerDrawer = document.getElementById('composer-drawer');
    const composerCloseBtn = document.getElementById('composer-close-btn');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const copyBtn = document.getElementById('copy-btn');
    const tweetBtn = document.getElementById('tweet-btn');
    
    // State
    let releaseNotes = [];
    let activeEntry = null;
    let selectedText = "";
    
    // Initial Load
    fetchReleaseNotes();
    
    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    searchInput.addEventListener('input', filterFeed);
    composerCloseBtn.addEventListener('click', closeComposer);
    tweetTextarea.addEventListener('input', updateCharCount);
    
    copyBtn.addEventListener('click', copyTweetText);
    tweetBtn.addEventListener('click', publishTweet);

    // Fetch Release Notes from API
    async function fetchReleaseNotes() {
        setLoadingState(true);
        try {
            const response = await fetch('/api/release-notes');
            if (!response.ok) throw new Error('Failed to fetch release notes.');
            
            const data = await response.json();
            releaseNotes = data.entries || [];
            
            renderFeed(releaseNotes);
            
            // Automatically select the first entry if available
            if (releaseNotes.length > 0) {
                selectEntry(releaseNotes[0]);
            } else {
                renderEmptyState();
            }
        } catch (error) {
            console.error('Error:', error);
            feedContainer.innerHTML = `
                <div class="empty-state">
                    <h3 style="color: #f87171;">Failed to load feed</h3>
                    <p style="margin-top: 0.5rem;">Please check your internet connection and try again.</p>
                </div>
            `;
        } finally {
            setLoadingState(false);
        }
    }

    // Set Loading Spinner State
    function setLoadingState(isLoading) {
        if (isLoading) {
            refreshIcon.classList.add('spinning');
            refreshBtn.disabled = true;
            // Clear content if empty
            if (releaseNotes.length === 0) {
                feedContainer.innerHTML = `
                    <div class="shimmer-container">
                        <div class="shimmer-card"></div>
                        <div class="shimmer-card"></div>
                        <div class="shimmer-card"></div>
                    </div>
                `;
            }
        } else {
            refreshIcon.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }

    // Render Left feed panel
    function renderFeed(notes) {
        feedContainer.innerHTML = '';
        
        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = `release-card ${activeEntry && activeEntry.id === note.id ? 'active' : ''}`;
            card.dataset.id = note.id;
            
            // Create time ago
            const timeAgo = formatTimeAgo(note.updated);
            
            // Clean content to make a brief snippet
            const snippet = stripHtml(note.content);
            
            // Determine badges based on categories
            const badges = detectCategories(note.content);
            const badgesHtml = badges.map(b => `<span class="badge badge-${b.type}">${b.label}</span>`).join('');
            
            card.innerHTML = `
                <div class="release-card-header">
                    <span class="release-date">${note.title}</span>
                    <span class="release-ago">${timeAgo}</span>
                </div>
                <p class="release-snippet">${snippet}</p>
                <div class="badge-container">
                    ${badgesHtml}
                </div>
            `;
            
            card.addEventListener('click', () => selectEntry(note));
            feedContainer.appendChild(card);
        });
    }

    // Render empty state if no release notes
    function renderEmptyState() {
        feedContainer.innerHTML = '<p class="empty-state">No release notes found.</p>';
        detailContainer.innerHTML = `
            <div class="empty-state">
                <h3>No updates available</h3>
                <p>There are currently no BigQuery release notes in the feed.</p>
            </div>
        `;
        selectionStatus.textContent = "No entry selected";
    }

    // Filter feed notes based on search input
    function filterFeed() {
        const query = searchInput.value.toLowerCase();
        const filtered = releaseNotes.filter(note => {
            return note.title.toLowerCase().includes(query) || 
                   note.content.toLowerCase().includes(query);
        });
        renderFeed(filtered);
    }

    // Select and display details for a release note entry
    function selectEntry(note) {
        activeEntry = note;
        selectionStatus.textContent = note.title;
        
        // Highlight active card
        document.querySelectorAll('.release-card').forEach(card => {
            if (card.dataset.id === note.id) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        
        // Render details container
        detailContainer.innerHTML = '';
        
        const detailsEl = document.createElement('div');
        detailsEl.className = 'release-details';
        
        const linkHtml = note.link ? `
            <a href="${note.link}" class="detail-link" target="_blank" rel="noopener noreferrer">
                <span>View official documentation</span>
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        ` : '';

        const pubDate = note.updated ? new Date(note.updated).toLocaleDateString(undefined, { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        }) : '';

        detailsEl.innerHTML = `
            <div class="detail-title-section">
                <h2 class="detail-title">Updates for ${note.title}</h2>
                <div class="detail-meta">
                    <span>Published: ${pubDate || 'N/A'}</span>
                    ${linkHtml}
                </div>
            </div>
            <div class="release-body" id="release-body-content">
                <!-- Selectable blocks will be generated here -->
            </div>
        `;
        
        detailContainer.appendChild(detailsEl);
        
        // Generate selectable sub-blocks from the content HTML
        generateSelectableBlocks(note.content, document.getElementById('release-body-content'));
    }

    // Parse feed content XML/HTML and group into selectable items based on headers
    function generateSelectableBlocks(htmlContent, container) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        const children = Array.from(tempDiv.children);
        let currentBlockElements = [];
        let currentHeaderLabel = "Release Note";

        function commitBlock() {
            if (currentBlockElements.length === 0) return;
            
            const blockDiv = document.createElement('div');
            blockDiv.className = 'selectable-block';
            
            // Build the block content
            currentBlockElements.forEach(el => {
                blockDiv.appendChild(el.cloneNode(true));
            });
            
            // Add Selection Indicator (Checkbox icon)
            const indicator = document.createElement('div');
            indicator.className = 'block-indicator';
            indicator.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            `;
            blockDiv.appendChild(indicator);
            
            // Add Inline "Tweet this" shortcut
            const actionRow = document.createElement('div');
            actionRow.className = 'block-hover-action';
            actionRow.innerHTML = `
                <button class="btn btn-inline-tweet btn-secondary">
                    <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>Draft Tweet</span>
                </button>
            `;
            
            blockDiv.appendChild(actionRow);
            
            // Text to be tweeted
            const textToTweet = extractCleanTextForBlock(currentBlockElements);
            
            // Click listeners
            blockDiv.addEventListener('click', (e) => {
                // Ignore clicks if the user clicked on a link inside the block
                if (e.target.tagName === 'A') return;
                
                // Toggle active block selection
                document.querySelectorAll('.selectable-block').forEach(b => {
                    if (b !== blockDiv) b.classList.remove('selected');
                });
                
                const isSelected = blockDiv.classList.toggle('selected');
                if (isSelected) {
                    openComposer(textToTweet);
                } else {
                    closeComposer();
                }
            });
            
            container.appendChild(blockDiv);
            
            // Clear current list
            currentBlockElements = [];
        }

        // Segment elements by H3 header tag
        children.forEach(child => {
            if (child.tagName === 'H3') {
                commitBlock();
                currentHeaderLabel = child.textContent.trim();
                currentBlockElements.push(child);
            } else {
                currentBlockElements.push(child);
            }
        });
        
        // Commit final block
        commitBlock();
        
        // If there were no blocks generated (e.g. empty content)
        if (container.children.length === 0) {
            container.innerHTML = `<p>${htmlContent}</p>`;
        }
    }

    // Extract clean plain text from parsed block nodes for composing tweet
    function extractCleanTextForBlock(elements) {
        let text = "";
        elements.forEach((el, index) => {
            if (el.tagName === 'H3') {
                text += `📢 BigQuery [${el.textContent.trim()}]:\n`;
            } else if (el.tagName === 'UL') {
                Array.from(el.querySelectorAll('li')).forEach(li => {
                    text += `• ${li.textContent.trim()}\n`;
                });
            } else {
                text += `${el.textContent.trim()}\n`;
            }
        });
        return text.trim();
    }

    // Open composer drawer and populate draft tweet
    function openComposer(text) {
        selectedText = text;
        
        // Compose default template: Date/Header + Selected Text + Hashtags + Link
        const dateStr = activeEntry ? activeEntry.title : "";
        const sourceUrl = activeEntry && activeEntry.link ? activeEntry.link : "https://cloud.google.com/bigquery";
        
        // Format body text and trim to fit X constraints
        // Length configuration:
        // Heading + Hashtags + link takes approx 70 characters. Leave 200 chars for actual release details.
        let bodyText = text;
        
        const intro = `BigQuery Updates (${dateStr}):\n`;
        const footer = `\n#BigQuery #GoogleCloud\n${sourceUrl}`;
        const reservedLength = intro.length + footer.length;
        const maxBodyLength = 280 - reservedLength - 5; // offset for ellipses
        
        if (bodyText.startsWith("📢 BigQuery")) {
            // Strip the redundant header if it matches
            bodyText = bodyText.replace(/^📢 BigQuery\s*\[.*?\]:\n?/, "");
        }
        
        if (bodyText.length > maxBodyLength) {
            bodyText = bodyText.substring(0, maxBodyLength) + "...";
        }
        
        tweetTextarea.value = `${intro}${bodyText}${footer}`;
        updateCharCount();
        
        composerDrawer.classList.add('open');
    }

    // Close composer drawer
    function closeComposer() {
        composerDrawer.classList.remove('open');
        document.querySelectorAll('.selectable-block').forEach(b => {
            b.classList.remove('selected');
        });
    }

    // Update tweet character count and apply colors based on limits
    function updateCharCount() {
        const count = tweetTextarea.value.length;
        charCounter.textContent = `${count} / 280`;
        
        if (count > 280) {
            charCounter.className = 'danger';
            tweetBtn.disabled = true;
        } else if (count > 250) {
            charCounter.className = 'warning';
            tweetBtn.disabled = false;
        } else {
            charCounter.className = '';
            tweetBtn.disabled = false;
        }
    }

    // Copy draft tweet to clipboard
    function copyTweetText() {
        tweetTextarea.select();
        navigator.clipboard.writeText(tweetTextarea.value).then(() => {
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied!</span>
            `;
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    // Redirect to X with Web Intent url
    function publishTweet() {
        const tweetText = tweetTextarea.value;
        const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(xUrl, '_blank', 'noopener,noreferrer');
    }

    // Utility: Format Time Ago (e.g. "3 days ago")
    function formatTimeAgo(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    // Utility: Strip HTML tags
    function stripHtml(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    // Utility: Detect categories from HTML content for UI badges
    function detectCategories(html) {
        const categories = [];
        const contentLower = html.toLowerCase();
        
        if (contentLower.includes('announcement')) {
            categories.push({ type: 'announcement', label: 'Announcement' });
        }
        if (contentLower.includes('new feature') || contentLower.includes('feature</b>') || contentLower.includes('feature:')) {
            categories.push({ type: 'feature', label: 'Feature' });
        }
        if (contentLower.includes('changed') || contentLower.includes('update') || contentLower.includes('behavior change')) {
            categories.push({ type: 'changed', label: 'Changed' });
        }
        if (contentLower.includes('deprecated') || contentLower.includes('deprecation')) {
            categories.push({ type: 'deprecated', label: 'Deprecate' });
        }
        
        if (categories.length === 0) {
            categories.push({ type: 'default', label: 'General' });
        }
        return categories.slice(0, 3); // Max 3 badges
    }
});
