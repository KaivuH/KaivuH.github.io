// All available files
const allFiles = [
  { id: 'about', path: 'content/about.txt', type: 'text', label: 'about.txt' },
  { id: 'black-lace-weaver', path: 'writing/black-lace-weaver.md', type: 'markdown', label: 'black-lace-weaver.md' },
  { id: 'post-memoriam', path: 'writing/post-memoriam.md', type: 'markdown', label: 'post-memoriam.md' },
  { id: 'the-apparition', path: 'writing/the-apparition.md', type: 'markdown', label: 'the-apparition.md' }
];

// File tree structure for sidebar - will be built dynamically
let fileTree = [];

// Track open tabs and their content
const openTabs = new Map();
let activeTabId = null;

// Syntax highlighting patterns
const syntaxPatterns = {
  text: [
    { pattern: /(\/\/.*$)/gm, class: 'comment' },
    { pattern: /(---)/g, class: 'comment' }
  ],
  markdown: [
    { pattern: /^(#{1,6}\s.*)$/gm, class: 'keyword' },
    { pattern: /\*\*([^*]+)\*\*/g, class: 'keyword' },
    { pattern: /\*([^*]+)\*/g, class: 'comment' },
    { pattern: /`([^`]+)`/g, class: 'string' },
    { pattern: /\[([^\]]+)\]\([^)]+\)/g, class: 'function' }
  ],
  json: [
    { pattern: /"([^"]+)"(?=\s*:)/g, class: 'property' },
    { pattern: /:\s*"([^"]+)"/g, class: 'string', capture: true },
    { pattern: /:\s*(\d+)/g, class: 'number', capture: true },
    { pattern: /:\s*(true|false|null)/g, class: 'keyword', capture: true },
    { pattern: /[{}\[\]]/g, class: 'operator' }
  ]
};

// URL patterns to auto-link
const urlPatterns = [
  { pattern: /(https?:\/\/[^\s"'<>]+)/g, replacement: '<a href="$1" target="_blank">$1</a>' },
  { pattern: /mailto:([^\s"'<>]+)/g, replacement: '<a href="mailto:$1">$1</a>' }
];

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightLine(line, type) {
  // First, find and preserve URLs before escaping
  const urlPlaceholders = [];
  let urlIndex = 0;
  let processed = line;

  // Find URLs and replace with placeholders
  processed = processed.replace(/(https?:\/\/[^\s"'<>]+)/g, (match) => {
    const placeholder = `__URL${urlIndex++}__`;
    urlPlaceholders.push({ placeholder, url: match });
    return placeholder;
  });

  // Now escape HTML
  let html = escapeHtml(processed);
  const patterns = syntaxPatterns[type] || syntaxPatterns.text;

  const placeholders = [];
  let placeholderIndex = 0;

  patterns.forEach(({ pattern, class: className, capture }) => {
    html = html.replace(pattern, (match, group1) => {
      const content = capture ? group1 : match;
      const placeholder = `__PH${placeholderIndex++}__`;
      placeholders.push({ placeholder, html: `<span class="${className}">${capture ? match.replace(group1, content) : content}</span>` });
      return capture ? match.replace(group1, placeholder) : placeholder;
    });
  });

  // Restore syntax highlighting placeholders
  placeholders.forEach(({ placeholder, html: replacement }) => {
    html = html.replace(placeholder, replacement);
  });

  // Restore URLs as clickable links
  urlPlaceholders.forEach(({ placeholder, url }) => {
    html = html.replace(placeholder, `<a href="${url}" target="_blank">${url}</a>`);
  });

  return html;
}

function renderContent(text, type) {
  const lines = text.split('\n');
  return lines.map(line => {
    const highlighted = highlightLine(line, type);
    return `<div class="line">${highlighted || ' '}</div>`;
  }).join('');
}

function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'md') return 'markdown';
  return 'text';
}

async function loadFileContent(fileConfig) {
  const type = fileConfig.type || getFileType(fileConfig.path);

  if (type === 'image') {
    return { type: 'image', html: `<img src="${fileConfig.path}" alt="${fileConfig.label}">` };
  }

  if (type === 'pdf') {
    return { type: 'pdf', html: `<embed src="${fileConfig.path}" type="application/pdf">` };
  }

  try {
    const response = await fetch(fileConfig.path);
    if (!response.ok) throw new Error(`Failed to load ${fileConfig.path}`);
    const text = await response.text();
    return { type: 'text', html: renderContent(text, type) };
  } catch (error) {
    console.error(error);
    return { type: 'text', html: `<div class="line"><span class="comment"># Error loading ${fileConfig.path}</span></div>` };
  }
}

// Tab management
async function openFile(fileId) {
  const fileConfig = allFiles.find(f => f.id === fileId);
  if (!fileConfig) return;

  if (openTabs.has(fileId)) {
    activateTab(fileId);
    return;
  }

  const content = await loadFileContent(fileConfig);

  const contentEl = document.createElement('div');
  contentEl.className = content.type === 'image' || content.type === 'pdf'
    ? 'code-content media-content'
    : 'code-content';
  contentEl.id = `content-${fileId}`;
  contentEl.innerHTML = content.html;
  document.getElementById('codeContainer').appendChild(contentEl);

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.fileId = fileId;
  tabEl.innerHTML = `
    <span class="tab-name">${fileConfig.label}</span>
    <button class="tab-close" onclick="closeTab(event, '${fileId}')">×</button>
  `;
  tabEl.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-close')) {
      activateTab(fileId);
    }
  });
  document.getElementById('tabsContainer').appendChild(tabEl);

  openTabs.set(fileId, {
    content,
    element: contentEl,
    tab: tabEl,
    config: fileConfig,
    isMedia: content.type === 'image' || content.type === 'pdf'
  });

  activateTab(fileId);
  updateSidebarActiveState(fileId);
}

function activateTab(fileId) {
  openTabs.forEach((data) => {
    data.element.classList.remove('active');
    data.tab.classList.remove('active');
  });

  const tabData = openTabs.get(fileId);
  if (tabData) {
    tabData.element.classList.add('active');
    tabData.tab.classList.add('active');
    activeTabId = fileId;

    if (!tabData.isMedia) {
      updateLineNumbers(tabData.element);
    } else {
      document.getElementById('lineNumbers').innerHTML = '';
    }

    updateStatusBar(tabData.config);
    updateSidebarActiveState(fileId);
  }
}

function closeTab(event, fileId) {
  event.stopPropagation();

  const tabData = openTabs.get(fileId);
  if (!tabData) return;

  tabData.element.remove();
  tabData.tab.remove();
  openTabs.delete(fileId);

  if (activeTabId === fileId) {
    const remainingIds = Array.from(openTabs.keys());
    if (remainingIds.length > 0) {
      activateTab(remainingIds[remainingIds.length - 1]);
    } else {
      activeTabId = null;
      document.getElementById('lineNumbers').innerHTML = '';
    }
  }

  updateSidebarActiveState(activeTabId);
}

function updateLineNumbers(contentEl) {
  const lines = contentEl.querySelectorAll('.line');
  const lineNumbers = document.getElementById('lineNumbers');
  lineNumbers.innerHTML = '';
  for (let i = 1; i <= lines.length; i++) {
    const span = document.createElement('span');
    span.textContent = i;
    lineNumbers.appendChild(span);
  }
}

function updateStatusBar(fileConfig) {
  const type = fileConfig.type || getFileType(fileConfig.path);
  const typeLabels = {
    text: 'Plain Text',
    markdown: 'Markdown',
    image: 'Image',
    pdf: 'PDF'
  };
  document.getElementById('statusFileType').textContent = `${typeLabels[type] || 'Text'} · UTF-8`;
}

function updateSidebarActiveState(fileId) {
  document.querySelectorAll('.file-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.fileId === fileId) {
      item.classList.add('active');
    }
  });
}

// Build file tree from allFiles
function buildFileTree() {
  const folders = {};

  allFiles.forEach(file => {
    const parts = file.path.split('/');
    const folder = parts[0];
    const filename = parts.slice(1).join('/');

    if (!folders[folder]) {
      folders[folder] = [];
    }
    folders[folder].push({ name: filename, fileId: file.id });
  });

  fileTree = Object.entries(folders).map(([name, children]) => ({
    name,
    type: 'folder',
    children: children.map(c => ({ name: c.name, type: 'file', fileId: c.fileId }))
  }));
}

function renderFileTree() {
  buildFileTree();
  const fileTreeEl = document.getElementById('fileTree');
  fileTreeEl.innerHTML = renderTreeItems(fileTree);

  fileTreeEl.querySelectorAll('.file-item').forEach(item => {
    item.addEventListener('click', () => {
      const fileId = item.dataset.fileId;
      const isFolder = item.classList.contains('folder');

      if (isFolder) {
        const contents = item.nextElementSibling;
        if (contents && contents.classList.contains('folder-contents')) {
          contents.classList.toggle('open');
          const icon = item.querySelector('.icon');
          icon.textContent = contents.classList.contains('open') ? '▼' : '▶';
        }
      } else if (fileId) {
        openFile(fileId);
      }
    });
  });
}

function renderTreeItems(items) {
  return items.map(item => {
    if (item.type === 'folder') {
      return `
        <div class="file-item folder" data-folder="${item.name}">
          <span class="icon">▶</span>
          <span>${item.name}</span>
        </div>
        <div class="folder-contents">
          ${renderTreeItems(item.children)}
        </div>
      `;
    } else {
      const icon = getFileIcon(item.name);
      return `
        <div class="file-item" data-file-id="${item.fileId}">
          <span class="icon">${icon}</span>
          <span>${item.name}</span>
        </div>
      `;
    }
  }).join('');
}

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'txt') return '📄';
  if (ext === 'md') return '📝';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return '🖼️';
  if (ext === 'pdf') return '📕';
  return '📄';
}

// Theme toggle
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// Terminal
const terminal = document.getElementById('terminal');
const terminalInput = document.getElementById('terminalInput');
const terminalOutput = document.getElementById('terminalOutput');

function toggleTerminal() {
  if (terminal.classList.contains('open')) {
    terminal.classList.remove('open');
    terminal.style.height = '0';
  } else {
    terminal.classList.add('open');
    terminal.style.height = '200px';
    terminalInput.focus();
  }
}

function closeTerminal(e) {
  e.stopPropagation();
  terminal.classList.remove('open');
  terminal.style.height = '0';
}

function initTerminalResize() {
  const resizeHandle = document.getElementById('terminalResize');
  let isResizing = false;
  let startY = 0;
  let startHeight = 0;

  resizeHandle.addEventListener('mousedown', (e) => {
    isResizing = true;
    startY = e.clientY;
    startHeight = terminal.offsetHeight;
    document.body.classList.add('resizing');
    resizeHandle.classList.add('dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const deltaY = startY - e.clientY;
    const newHeight = Math.min(Math.max(startHeight + deltaY, 100), window.innerHeight * 0.8);
    terminal.style.height = newHeight + 'px';
    terminal.classList.add('open');
  });

  document.addEventListener('mouseup', () => {
    if (isResizing) {
      isResizing = false;
      document.body.classList.remove('resizing');
      resizeHandle.classList.remove('dragging');
    }
  });
}

// Current working directory
let cwd = '~';

function getPrompt() {
  return cwd === '~' ? '~$' : `${cwd}$`;
}

function updatePrompt() {
  document.querySelector('.terminal-prompt').textContent = getPrompt();
}

// Terminal commands
const commands = {
  help: () => ({
    type: 'success',
    text: `available commands:
  ls            — list files/folders
  cd [folder]   — change directory
  cd ..         — go up one level
  cat [file]    — view a file
  open [file]   — open file in tab
  pwd           — print working directory
  theme         — toggle dark/light
  whoami        — about me
  clear         — clear terminal
  github        — open github
  twitter       — open twitter
  scholar       — open google scholar
  email         — say hi`
  }),
  pwd: () => ({ type: 'cmd', text: cwd === '~' ? '~' : `~/${cwd}` }),
  cd: (args) => {
    if (!args[0] || args[0] === '~') {
      cwd = '~';
      updatePrompt();
      return { type: 'success', text: '' };
    }
    if (args[0] === '..') {
      if (cwd !== '~') {
        cwd = '~';
        updatePrompt();
      }
      return { type: 'success', text: '' };
    }
    // Check if folder exists
    const targetFolder = args[0].replace(/\/$/, ''); // remove trailing slash
    const folder = fileTree.find(f => f.name === targetFolder);
    if (folder) {
      cwd = targetFolder;
      updatePrompt();
      return { type: 'success', text: '' };
    }
    return { type: 'err', text: `cd: ${args[0]}: No such directory` };
  },
  ls: (args) => {
    const targetDir = args[0] || (cwd === '~' ? null : cwd);

    if (targetDir) {
      const folder = fileTree.find(f => f.name === targetDir);
      if (folder) {
        return { type: 'cmd', text: folder.children.map(c => c.name).join('  ') };
      }
      return { type: 'err', text: `ls: ${targetDir}: No such directory` };
    }
    return { type: 'cmd', text: fileTree.map(f => f.name + '/').join('  ') };
  },
  clear: () => {
    terminalOutput.innerHTML = '';
    return null;
  },
  theme: () => {
    toggleTheme();
    const current = document.documentElement.getAttribute('data-theme');
    return { type: 'success', text: `switched to ${current || 'light'} mode` };
  },
  whoami: () => ({ type: 'cmd', text: 'kaivu — building things, breaking things, writing about it' }),
  github: () => {
    window.open('https://github.com/KaivuH', '_blank');
    return { type: 'success', text: 'opening github...' };
  },
  twitter: () => {
    window.open('https://twitter.com/kaivuhariharan', '_blank');
    return { type: 'success', text: 'opening twitter...' };
  },
  scholar: () => {
    window.open('https://scholar.google.com/citations?user=JXNx9pQAAAAJ&hl=en', '_blank');
    return { type: 'success', text: 'opening google scholar...' };
  },
  email: () => {
    window.location.href = 'mailto:kaivu@fulcrum.inc';
    return { type: 'success', text: 'opening mail client...' };
  },
  vim: () => ({ type: 'err', text: 'not a vim user' }),
  rm: (args) => {
    if (args.includes('-rf') || args.includes('-fr')) {
      return { type: 'err', text: 'nice try. not today.' };
    }
    return { type: 'err', text: 'rm: permission denied' };
  }
};

// Build file aliases from allFiles
function getFileAliases() {
  const aliases = {};
  allFiles.forEach(f => {
    aliases[f.id] = f.id;
    aliases[f.label] = f.id;
    aliases[f.label.replace(/\.[^.]+$/, '')] = f.id; // without extension
  });
  return aliases;
}

function resolveFilePath(filename) {
  // If we're in a directory, try to find file there first
  if (cwd !== '~') {
    const folder = fileTree.find(f => f.name === cwd);
    if (folder) {
      const file = folder.children.find(c => c.name === filename || c.name === filename.replace(/\.[^.]+$/, ''));
      if (file) return file.fileId;
    }
  }

  // Otherwise search all files
  const fileAliases = getFileAliases();
  const cleaned = filename.toLowerCase().replace(/^(content|writing|notes)\//, '');
  return fileAliases[cleaned];
}

async function runCommand(input) {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  if (!cmd) return null;

  if (cmd === 'open' || cmd === 'cat') {
    if (!args[0]) return { type: 'err', text: `usage: ${cmd} [file]` };
    const fileId = resolveFilePath(args[0]);
    if (fileId) {
      openFile(fileId);
      return { type: 'success', text: `opened ${args[0]}` };
    }
    return { type: 'err', text: `${cmd}: ${args[0]}: No such file` };
  }

  if (commands[cmd]) return commands[cmd](args);

  // Try as file name directly
  const fileId = resolveFilePath(cmd);
  if (fileId) {
    openFile(fileId);
    return { type: 'success', text: `opened ${cmd}` };
  }

  return { type: 'err', text: `command not found: ${cmd}. try 'help'` };
}

function addOutput(result) {
  if (!result) return;
  const div = document.createElement('div');
  div.className = result.type;
  div.style.whiteSpace = 'pre-wrap';
  div.textContent = result.text;
  terminalOutput.appendChild(div);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

terminalInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const input = terminalInput.value;
    if (input.trim()) {
      addOutput({ type: 'cmd', text: `${getPrompt()} ${input}` });
      const result = await runCommand(input);
      addOutput(result);
    }
    terminalInput.value = '';
  }
});

terminal.addEventListener('click', () => terminalInput.focus());

// Initialize
async function init() {
  renderFileTree();
  initTerminalResize();
  await openFile('about');
}

document.addEventListener('DOMContentLoaded', init);
