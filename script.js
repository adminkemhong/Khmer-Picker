document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const form = document.getElementById('entry-form');
    const nameInput = document.getElementById('name-input');
    const entriesList = document.getElementById('entries-list');
    const countDisplay = document.getElementById('count');
    
    // Class Management
    const classSelect = document.getElementById('class-select');
    const addClassBtn = document.getElementById('add-class-btn');
    const deleteClassBtn = document.getElementById('delete-class-btn');
    
    const chkMysteryWheel = document.getElementById('chk-mystery-wheel');
    const chkMysteryResult = document.getElementById('chk-mystery-result');
    const optSortAZ = document.getElementById('opt-sort-az');
    const optDeleteEmpty = document.getElementById('opt-delete-empty');
    const navNewWheel = document.getElementById('nav-new-wheel');
    
    // Top Controls
    const togglePanelBtn = document.getElementById('toggle-panel-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const leftPanel = document.querySelector('.left-panel');
    let isPanelHidden = false;
    
    // Search
    const searchInput = document.getElementById('search-input');

    // Group Generation
    const makeGroupBtn = document.getElementById('make-group-btn');
    const groupConfigModal = document.getElementById('group-config-modal');
    const closeConfigBtn = document.getElementById('close-config-btn');
    const generateGroupsBtn = document.getElementById('generate-groups-btn');
    const groupCountInput = document.getElementById('group-count');
    const memberCountInput = document.getElementById('member-count');
    
    const groupResultModal = document.getElementById('group-result-modal');
    const groupResultTitle = document.getElementById('group-result-title');
    const closeResultBtn = document.getElementById('close-result-btn');
    const groupResultsContainer = document.getElementById('group-results-container');
    const exportImageBtn = document.getElementById('export-image-btn');

    // Wheel & Modal
    const canvas = document.getElementById('wheel');
    const ctx = canvas.getContext('2d');
    const spinBtn = document.getElementById('spin-btn-center');
    const modal = document.getElementById('winner-modal');
    const winnerName = document.getElementById('winner-name');
    const winnerTitle = document.getElementById('winner-announcement');
    const revealBtn = document.getElementById('reveal-btn');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const removeWinnerBtn = document.getElementById('remove-winner-btn');

    // --- State ---
    let classes = [];
    let currentClassId = null;
    let currentRotation = 0;
    let isSpinning = false;
    let currentWinner = null;
    let isMysteryWheel = false;
    let isMysteryResult = false;
    let searchQuery = "";
    
    // --- Audio Context ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;

    const playTickSound = () => {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    };

    const playWinSound = () => {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); 
        oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1); 
        oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2); 
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.3); 
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.5);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 1.5);
    };
    
    // --- Wheel Colors ---
    const colors = [
        '#ff3366', '#4facfe', '#ffd700', '#00f2fe', 
        '#43e97b', '#fa709a', '#fbc2eb', '#a18cd1',
        '#ff9a9e', '#fecfef'
    ];

    // --- Data Management ---
    const loadData = () => {
        const savedClasses = localStorage.getItem('pickerClasses');
        if (savedClasses) {
            classes = JSON.parse(savedClasses);
            currentClassId = localStorage.getItem('pickerCurrentClassId');
            if (!currentClassId && classes.length > 0) currentClassId = classes[0].id;
        } else {
            // Migration from old version
            const oldEntries = localStorage.getItem('pickerEntries');
            let initialEntries = [];
            if (oldEntries) {
                initialEntries = JSON.parse(oldEntries);
            }
            const newClass = { id: Date.now().toString(), name: 'ថ្នាក់ទី១', entries: initialEntries };
            classes = [newClass];
            currentClassId = newClass.id;
        }
        
        if (!classes.find(c => c.id === currentClassId) && classes.length > 0) {
            currentClassId = classes[0].id;
        }
        
        // Load Options State
        isMysteryWheel = localStorage.getItem('pickerMysteryWheel') === 'true';
        isMysteryResult = localStorage.getItem('pickerMysteryResult') === 'true';
        chkMysteryWheel.checked = isMysteryWheel;
        chkMysteryResult.checked = isMysteryResult;
        
        updateUI();
    };

    const saveData = () => {
        localStorage.setItem('pickerClasses', JSON.stringify(classes));
        if (currentClassId) {
            localStorage.setItem('pickerCurrentClassId', currentClassId.toString());
        }
        localStorage.setItem('pickerMysteryWheel', isMysteryWheel);
        localStorage.setItem('pickerMysteryResult', isMysteryResult);
    };

    const getCurrentClass = () => {
        return classes.find(c => c.id === currentClassId);
    };

    const updateUI = () => {
        renderClassSelect();
        renderList();
        drawWheel();
    };

    // --- Class Management ---
    const renderClassSelect = () => {
        classSelect.innerHTML = '';
        if (classes.length === 0) {
            const opt = document.createElement('option');
            opt.textContent = 'សូមបង្កើតថ្នាក់...';
            classSelect.appendChild(opt);
            return;
        }
        
        classes.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            if (c.id === currentClassId) opt.selected = true;
            classSelect.appendChild(opt);
        });
    };

    classSelect.addEventListener('change', (e) => {
        currentClassId = e.target.value;
        saveData();
        updateUI();
    });

    addClassBtn.addEventListener('click', () => {
        const className = prompt('សូមបញ្ចូលឈ្មោះថ្នាក់ថ្មី៖');
        if (className && className.trim()) {
            const newClass = { id: Date.now().toString(), name: className.trim(), entries: [] };
            classes.push(newClass);
            currentClassId = newClass.id;
            saveData();
            updateUI();
        }
    });

    deleteClassBtn.addEventListener('click', () => {
        if (classes.length === 0) return;
        const currentClass = getCurrentClass();
        if (confirm(`តើអ្នកពិតជាចង់លុបថ្នាក់ "${currentClass.name}" មែនទេ?`)) {
            classes = classes.filter(c => c.id !== currentClassId);
            if (classes.length > 0) {
                currentClassId = classes[0].id;
            } else {
                currentClassId = null;
            }
            saveData();
            updateUI();
        }
    });

    // --- Form & List ---
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentClass = getCurrentClass();
        if (!currentClass) {
            alert('សូមបង្កើតថ្នាក់សិនមុននឹងបញ្ចូលឈ្មោះ!');
            return;
        }

        const nameText = nameInput.value.trim();
        if (nameText) {
            const names = nameText.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
            names.forEach(name => {
                currentClass.entries.push({ id: Date.now() + Math.random(), name });
            });
            nameInput.value = '';
            nameInput.focus();
            saveData();
            updateUI();
        }
    });

    const renderList = () => {
        const currentClass = getCurrentClass();
        if (!currentClass) {
            entriesList.innerHTML = '<div class="empty-state">សូមបង្កើតថ្នាក់ថ្មី។</div>';
            countDisplay.textContent = '0';
            return;
        }

        let displayEntries = currentClass.entries;
        
        if (searchQuery) {
            displayEntries = displayEntries.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        countDisplay.textContent = currentClass.entries.length;
        
        if (displayEntries.length === 0) {
            if (searchQuery) {
                entriesList.innerHTML = '<div class="empty-state">រកមិនឃើញឈ្មោះនេះទេ។</div>';
            } else {
                entriesList.innerHTML = '<div class="empty-state">គ្មានទិន្នន័យ។ សូមបញ្ចូលឈ្មោះនៅខាងលើ!</div>';
            }
            return;
        }

        entriesList.innerHTML = '';
        displayEntries.forEach((entry, index) => {
            const el = document.createElement('div');
            el.className = 'entry-item';
            el.innerHTML = `
                <div class="entry-info">
                    <div class="entry-name">${index + 1}. ${entry.name}</div>
                </div>
                <button class="delete-item-btn" data-id="${entry.id}" title="លុបឈ្មោះនេះ">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            entriesList.appendChild(el);
        });

        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseFloat(e.currentTarget.getAttribute('data-id'));
                currentClass.entries = currentClass.entries.filter(item => item.id !== id);
                saveData();
                updateUI();
            });
        });
    };

    // --- Options Buttons ---
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderList();
    });

    // Mystery Wheel Toggle
    chkMysteryWheel.addEventListener('change', (e) => {
        isMysteryWheel = e.target.checked;
        saveData();
        drawWheel();
    });

    // Mystery Result Toggle
    chkMysteryResult.addEventListener('change', (e) => {
        isMysteryResult = e.target.checked;
        saveData();
    });

    // Sort A-Z
    optSortAZ.addEventListener('click', () => {
        const currentClass = getCurrentClass();
        if (currentClass) {
            currentClass.entries.sort((a, b) => a.name.localeCompare(b.name, 'km'));
            saveData();
            updateUI();
        }
    });

    // Delete Empty
    optDeleteEmpty.addEventListener('click', () => {
        const currentClass = getCurrentClass();
        if (currentClass) {
            currentClass.entries = currentClass.entries.filter(e => e.name.trim() !== '');
            saveData();
            updateUI();
        }
    });

    // New Wheel
    navNewWheel.addEventListener('click', () => {
        const currentClass = getCurrentClass();
        if (!currentClass || currentClass.entries.length === 0) return;
        if (confirm('តើអ្នកពិតជាចង់លុបឈ្មោះទាំងអស់នៅលើកង់មែនទេ?')) {
            currentClass.entries = [];
            saveData();
            updateUI();
        }
    });

    // --- Draw Wheel ---
    const drawWheel = () => {
        const currentClass = getCurrentClass();
        const entries = currentClass ? currentClass.entries : [];
        const numSegments = entries.length;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (numSegments === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.stroke();
            return;
        }

        const arc = (2 * Math.PI) / numSegments;

        for (let i = 0; i < numSegments; i++) {
            const angle = i * arc;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, angle, angle + arc, false);
            ctx.lineTo(centerX, centerY);
            
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            ctx.save();
            
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
            
            ctx.translate(centerX, centerY);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 18px "Kantumruy Pro", sans-serif';
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            
            let text = isMysteryWheel ? '???' : entries[i].name;
            if (text.length > 15) {
                text = text.substring(0, 15) + '...';
            }
            ctx.fillText(text, radius - 20, 6);
            ctx.restore();
        }
    };

    // --- Spin Logic ---
    const spin = () => {
        const currentClass = getCurrentClass();
        if (isSpinning || !currentClass || currentClass.entries.length === 0) return;
        
        isSpinning = true;
        spinBtn.disabled = true;
        
        const extraSpins = Math.floor(Math.random() * 5) + 15;
        const randomDegree = Math.floor(Math.random() * 360);
        
        const totalRotation = currentRotation + (extraSpins * 360) + randomDegree;
        currentRotation = totalRotation;
        
        canvas.style.transform = `rotate(${currentRotation}deg)`;
        
        let currentDelay = 20;
        const tickLoop = () => {
            if (!isSpinning) return;
            playTickSound();
            currentDelay = currentDelay * 1.1; 
            if (currentDelay < 600) {
                setTimeout(tickLoop, currentDelay);
            }
        };
        tickLoop();
        
        setTimeout(() => {
            isSpinning = false;
            spinBtn.disabled = false;
            determineWinner(currentRotation);
        }, 4000);
    };

    const determineWinner = (rotation) => {
        const normalizedRotation = rotation % 360;
        const pointerAngle = (360 - normalizedRotation) % 360;
        const currentClass = getCurrentClass();
        const numSegments = currentClass.entries.length;
        const segmentAngle = 360 / numSegments;
        const winningIndex = Math.floor(pointerAngle / segmentAngle);
        
        const winner = currentClass.entries[winningIndex];
        showModal(winner);
    };

    // --- Modal Logic ---
    const showModal = (winner) => {
        currentWinner = winner;
        modal.classList.remove('hidden');
        winnerTitle.textContent = "អ្នកដែលត្រូវឆ្លើយគឺ៖";
        
        if (isMysteryResult) {
            winnerName.textContent = "???";
            revealBtn.classList.remove('hidden');
        } else {
            winnerName.textContent = winner.name;
            revealBtn.classList.add('hidden');
            playWinSound();
            fireConfetti();
        }
    };

    revealBtn.addEventListener('click', () => {
        if (currentWinner) {
            winnerName.textContent = currentWinner.name;
            revealBtn.classList.add('hidden');
            playWinSound();
            fireConfetti();
        }
    });

    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    removeWinnerBtn.addEventListener('click', () => {
        const currentClass = getCurrentClass();
        if (currentWinner && currentClass) {
            currentClass.entries = currentClass.entries.filter(item => item.id !== currentWinner.id);
            saveData();
            updateUI();
            modal.classList.add('hidden');
            currentWinner = null;
        }
    });

    const fireConfetti = () => {
        var duration = 3 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 101 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        var interval = setInterval(function() {
            var timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            var particleCount = 50 * (timeLeft / duration);
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    };

    // --- Top Controls ---
    togglePanelBtn.addEventListener('click', () => {
        isPanelHidden = !isPanelHidden;
        if (isPanelHidden) {
            leftPanel.classList.add('hidden');
            togglePanelBtn.innerHTML = '<i class="fa-solid fa-eye"></i>';
        } else {
            leftPanel.classList.remove('hidden');
            togglePanelBtn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
        }
    });

    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
        } else {
            fullscreenBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
        }
    });

    // --- Group Generation ---
    makeGroupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentClass = getCurrentClass();
        if (!currentClass || currentClass.entries.length === 0) {
            alert('សូមបញ្ចូលឈ្មោះសិស្សជាមុនសិន!');
            return;
        }
        groupCountInput.value = '';
        memberCountInput.value = '';
        groupConfigModal.classList.remove('hidden');
    });

    closeConfigBtn.addEventListener('click', () => {
        groupConfigModal.classList.add('hidden');
    });

    // Auto-clear the other input when one is typed
    groupCountInput.addEventListener('input', () => {
        if (groupCountInput.value) memberCountInput.value = '';
    });
    memberCountInput.addEventListener('input', () => {
        if (memberCountInput.value) groupCountInput.value = '';
    });

    generateGroupsBtn.addEventListener('click', () => {
        const currentClass = getCurrentClass();
        if (!currentClass || currentClass.entries.length === 0) return;

        const numGroups = parseInt(groupCountInput.value);
        const numMembers = parseInt(memberCountInput.value);
        const entries = [...currentClass.entries];

        if (!numGroups && !numMembers) {
            alert('សូមបញ្ចូលចំនួនក្រុម ឬចំនួនសមាជិក!');
            return;
        }

        // Fisher-Yates Shuffle
        for (let i = entries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [entries[i], entries[j]] = [entries[j], entries[i]];
        }

        let groups = [];
        
        if (numGroups > 0) {
            // Divide into N groups
            for (let i = 0; i < numGroups; i++) groups.push([]);
            entries.forEach((entry, index) => {
                groups[index % numGroups].push(entry);
            });
        } else if (numMembers > 0) {
            // Chunk by N members
            for (let i = 0; i < entries.length; i += numMembers) {
                groups.push(entries.slice(i, i + numMembers));
            }
        }

        // Render Groups
        groupResultTitle.innerHTML = `<i class="fa-solid fa-users"></i> លទ្ធផលចាប់ក្រុមថ្នាក់ ${currentClass.name}`;
        groupResultsContainer.innerHTML = '';

        groups.forEach((group, index) => {
            if (group.length === 0) return;
            const card = document.createElement('div');
            card.className = 'group-card';
            card.innerHTML = `
                <div class="group-title">ក្រុមទី ${index + 1} (${group.length} នាក់)</div>
                <div class="group-members">
                    ${group.map((g, memberIndex) => {
                        const isLeader = memberIndex === 0;
                        const icon = isLeader ? '<i class="fa-solid fa-flag" style="color: #ffd700; margin-left: 5px;" title="ប្រធានក្រុម"></i>' : '';
                        return `<div class="group-member">${g.name}${icon}</div>`;
                    }).join('')}
                </div>
            `;
            groupResultsContainer.appendChild(card);
        });

        const note = document.createElement('div');
        note.style.textAlign = 'center';
        note.style.color = 'var(--accent-color)';
        note.style.marginTop = '15px';
        note.style.fontSize = '0.95rem';
        note.style.gridColumn = '1 / -1';
        note.innerHTML = '<i class="fa-solid fa-flag"></i> បញ្ជាក់៖ អ្នកដែលមានទង់ជ័យនៅខាងចុងឈ្មោះ គឺជាប្រធានក្រុម';
        groupResultsContainer.appendChild(note);

        groupConfigModal.classList.add('hidden');
        groupResultModal.classList.remove('hidden');
        
        // Play success sound
        playWinSound();
    });

    closeResultBtn.addEventListener('click', () => {
        groupResultModal.classList.add('hidden');
    });

    // Image Export
    exportImageBtn.addEventListener('click', () => {
        const targetElement = document.querySelector('.result-modal-content');
        const resultsContainer = document.getElementById('group-results-container');
        
        // Hide buttons for screenshot
        const actions = targetElement.querySelectorAll('.modal-actions, .close-icon-btn');
        actions.forEach(el => el.style.display = 'none');
        
        // Temporarily remove max-height to capture full content
        const originalMaxHeight = resultsContainer.style.maxHeight;
        const originalOverflow = resultsContainer.style.overflowY;
        resultsContainer.style.maxHeight = 'none';
        resultsContainer.style.overflowY = 'visible';
        
        targetElement.style.background = '#1a1f35'; // solid background for clear image
        
        html2canvas(targetElement, {
            backgroundColor: '#1a1f35',
            scale: 2 // higher resolution
        }).then(canvas => {
            // Restore buttons and styles
            actions.forEach(el => el.style.display = '');
            resultsContainer.style.maxHeight = originalMaxHeight;
            resultsContainer.style.overflowY = originalOverflow;
            targetElement.style.background = '';

            const link = document.createElement('a');
            link.download = `Group-Result-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    });

    // Event Listeners
    spinBtn.addEventListener('click', spin);
    canvas.addEventListener('click', spin);

    // --- New Features: Top Navigation & Modals ---
    const navSettings = document.getElementById('nav-settings');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    
    navSettings.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));

    const toolName = document.getElementById('tool-name');
    const toolTeam = document.getElementById('tool-team');
    const toolYesno = document.getElementById('tool-yesno');
    const toolNumber = document.getElementById('tool-number');
    const toolLetter = document.getElementById('tool-letter');
    
    const numberPickerModal = document.getElementById('number-picker-modal');
    const closeNumberBtn = document.getElementById('close-number-btn');
    const generateNumbersBtn = document.getElementById('generate-numbers-btn');
    const numMin = document.getElementById('num-min');
    const numMax = document.getElementById('num-max');

    toolName.addEventListener('click', (e) => {
        e.preventDefault();
        // Just closes any menus or focuses on the input
        document.getElementById('name-input').focus();
    });

    toolTeam.addEventListener('click', (e) => {
        e.preventDefault();
        // Triggers the make group modal
        document.getElementById('make-group-btn').click();
    });

    toolYesno.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('ការប្ដូរទៅ "ចាប់បាទ/ទេ" នឹងលុបឈ្មោះបច្ចុប្បន្នចោល។ បន្ត?')) {
            classes[currentClassId].entries = [
                { id: Date.now().toString() + '1', name: 'បាទ/ចាស', active: true },
                { id: Date.now().toString() + '2', name: 'ទេ', active: true }
            ];
            saveData();
            updateUI();
        }
    });

    toolLetter.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('ការប្ដូរទៅ "ចាប់អក្សរ" នឹងលុបឈ្មោះបច្ចុប្បន្នចោល។ បន្ត?')) {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
            classes[currentClassId].entries = letters.map((l, i) => ({
                id: Date.now().toString() + i,
                name: l,
                active: true
            }));
            saveData();
            updateUI();
        }
    });

    toolNumber.addEventListener('click', (e) => {
        e.preventDefault();
        numberPickerModal.classList.remove('hidden');
    });

    closeNumberBtn.addEventListener('click', () => {
        numberPickerModal.classList.add('hidden');
    });

    generateNumbersBtn.addEventListener('click', () => {
        const min = parseInt(numMin.value);
        const max = parseInt(numMax.value);
        
        if (isNaN(min) || isNaN(max) || min >= max || max - min > 500) {
            alert('សូមបញ្ចូលលេខចាប់ផ្ដើម និងលេខបញ្ចប់ឱ្យបានត្រឹមត្រូវ! (ចន្លោះមិនលើសពី ៥០០)');
            return;
        }

        if (confirm('ការបង្កើតលេខថ្មី នឹងលុបទិន្នន័យបច្ចុប្បន្នចោល។ បន្ត?')) {
            const newEntries = [];
            for (let i = min; i <= max; i++) {
                newEntries.push({
                    id: Date.now().toString() + i,
                    name: i.toString(),
                    active: true
                });
            }
            classes[currentClassId].entries = newEntries;
            saveData();
            updateUI();
            numberPickerModal.classList.add('hidden');
        }
    });
    // ---------------------------------------------

    // Init
    loadData();
});
