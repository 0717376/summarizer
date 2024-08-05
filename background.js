// Регистрация обработчика клика вне onInstalled
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['highlight.min.js', 'marked.min.js']
  }, () => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: summarizePage
    });
  });
});

// onInstalled для инициализации при установке
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

async function summarizePage() {
  console.log('Executing summarizePage');

  // Удаляем предыдущий контейнер, если он существует
  let existingContainer = document.getElementById('summary-extension-container');
  if (existingContainer) {
    existingContainer.remove();
  }

  // Создаем изолированный контейнер
  const container = document.createElement('div');
  container.id = 'summary-extension-container';
  
  // Устанавливаем стили для полной изоляции
  const containerStyles = `
    all: initial;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 2147483647;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  `;
  container.style.cssText = containerStyles;

  // Создаем Shadow DOM для дополнительной изоляции
  const shadowRoot = container.attachShadow({mode: 'closed'});

  // Создаем стили для содержимого Shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after {
      box-sizing: border-box;
    }
    :host {
      all: initial;
      display: block;
    }
    .modal {
      position: relative;
      background-color: #ffffff;
      color: #333333;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      width: 800px;
      max-width: 90vw;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      font-size: 16px;
      line-height: 1.5;
    }
    .modal-header {
      padding: 16px 24px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-title {
      font-size: 1.25em;
      font-weight: 600;
      margin: 0;
    }
    .modal-content {
      padding: 24px;
      overflow-y: auto;
    }
    .close-button {
      padding: 8px 12px;
      background-color: #f3f4f6;
      color: #374151;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    }
    .close-button:hover {
      background-color: #e5e7eb;
    }
    .custom-summary {
      margin-top: 16px;
    }
    .custom-summary h1 {
      font-size: 1.5em;
      margin-top: 24px;
      margin-bottom: 16px;
    }
    .custom-summary h2 {
      font-size: 1.3em;
      margin-top: 20px;
      margin-bottom: 14px;
    }
    .custom-summary h3 {
      font-size: 1.1em;
      margin-top: 18px;
      margin-bottom: 12px;
    }
    .custom-summary h4, .custom-summary h5, .custom-summary h6 {
      font-size: 1em;
      margin-top: 16px;
      margin-bottom: 10px;
    }
    .custom-summary p, .custom-summary ul, .custom-summary ol {
      margin-bottom: 16px;
    }
    .custom-summary ul, .custom-summary ol {
      padding-left: 24px;
    }
    .custom-summary li {
      margin-bottom: 4px;
    }
    .custom-summary a {
      color: #2563eb;
      text-decoration: none;
    }
    .custom-summary a:hover {
      text-decoration: underline;
    }
    .disclaimer {
      color: #6b7280;
      text-align: center;
      font-size: 12px;
      margin-bottom: 16px;
    }
    .loader {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3498db;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      margin: 24px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .hljs {
      display: block;
      overflow-x: auto;
      padding: 1em;
      background: #282c34;
      color: #abb2bf;
      border-radius: 6px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 14px;
    }
    .hljs-keyword, .hljs-selector-tag, .hljs-tag {
      color: #c678dd;
    }
    .hljs-title, .hljs-name {
      color: #61afef;
    }
    .hljs-attribute {
      color: #e06c75;
    }
    .hljs-string, .hljs-selector-attr, .hljs-selector-pseudo {
      color: #98c379;
    }
    .hljs-comment {
      color: #7f848e;
    }
    .hljs-number {
      color: #d19a66;
    }
    .hljs-built_in, .hljs-literal {
      color: #56b6c2;
    }
    .hljs-class .hljs-title {
      color: #e5c07b;
    }
  `;

  const modal = document.createElement('div');
  modal.className = 'modal';

  const modalHeader = document.createElement('div');
  modalHeader.className = 'modal-header';

  const modalTitle = document.createElement('h2');
  modalTitle.className = 'modal-title';
  modalTitle.textContent = 'Резюме страницы';

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Закрыть';
  closeButton.className = 'close-button';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(container);
  });

  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeButton);

  const modalContent = document.createElement('div');
  modalContent.className = 'modal-content';

  modal.appendChild(modalHeader);
  modal.appendChild(modalContent);

  shadowRoot.appendChild(style);
  shadowRoot.appendChild(modal);
  document.body.appendChild(container);

  chrome.storage.sync.get(['bearerToken'], async (result) => {
    const bearerToken = result.bearerToken;

    if (!bearerToken) {
      const tokenInputLabel = document.createElement('label');
      tokenInputLabel.textContent = 'Введите Bearer Token:';
      tokenInputLabel.style.cssText = `
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
      `;

      const tokenInput = document.createElement('input');
      tokenInput.type = 'text';
      tokenInput.style.cssText = `
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 14px;
        margin-bottom: 16px;
      `;

      const saveButton = document.createElement('button');
      saveButton.textContent = 'Сохранить';
      saveButton.style.cssText = `
        padding: 8px 16px;
        background-color: #2563eb;
        color: #ffffff;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background-color 0.2s;
      `;
      saveButton.addEventListener('mouseover', () => {
        saveButton.style.backgroundColor = '#1d4ed8';
      });
      saveButton.addEventListener('mouseout', () => {
        saveButton.style.backgroundColor = '#2563eb';
      });
      saveButton.addEventListener('click', async () => {
        const token = tokenInput.value;
        if (token) {
          try {
            const testResponse = await fetch('https://ai.muravskiy.com/ollama/api/tags', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            if (!testResponse.ok) {
              throw new Error('Токен некорректный');
            }
            chrome.storage.sync.set({ bearerToken: token }, () => {
              alert('Token сохранен! Попробуйте снова.');
              document.body.removeChild(container);
            });
          } catch (error) {
            alert('Пожалуйста, введите валидный Bearer Token.');
          }
        } else {
          alert('Пожалуйста, введите Bearer Token.');
        }
      });

      modalContent.appendChild(tokenInputLabel);
      modalContent.appendChild(tokenInput);
      modalContent.appendChild(saveButton);
    } else {
      const summaryText = document.createElement('div');
      summaryText.className = 'custom-summary';

      const disclaimerText = document.createElement('div');
      disclaimerText.textContent = 'Ответы LLM могут быть ошибочны и неточны';
      disclaimerText.className = 'disclaimer';

      const loader = document.createElement('div');
      loader.className = 'loader';

      modalContent.appendChild(disclaimerText);
      modalContent.appendChild(loader);
      modalContent.appendChild(summaryText);

      try {
        console.log('Отправка запроса на суммаризацию');
        summaryText.style.display = 'none';
        loader.style.display = 'block';

        const pageContent = document.body.innerText;

        const response = await fetch('https://ai.muravskiy.com/ollama/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${bearerToken}`
          },
          body: JSON.stringify({
            model: 'gemma2:27b',
            prompt: `Суммаризируй следующий текст, выделив самую важную информацию:

${pageContent}

Пожалуйста, дай краткий и информативный ответ на русском языке. Используй markdown для форматирования, где это уместно.`,
            options: {
              num_ctx: 8192
            },
            stream: true
          })
        });

        console.log('Статус ответа:', response.status);

        if (!response.ok) {
          throw new Error(`Ошибка HTTP! Статус: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let summary = '';
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          console.log('Получен чанк:', done, value);

          if (!done) {
            loader.style.display = 'none';
            summaryText.style.display = 'block';
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.trim() === '') continue;

            try {
              const data = JSON.parse(line);

              if (data.response) {
                summary += data.response;
              }
            } catch (error) {
              console.warn('Неверный JSON:', line);
            }
          }

          const md = marked.parse(summary);
          summaryText.innerHTML = md;

          shadowRoot.querySelectorAll('.custom-summary pre code').forEach((block) => {
            hljs.highlightBlock(block);
          });

          if (done) {
            break;
          }
        }

        console.log('Стрим завершен');
      } catch (error) {
        console.error('Ошибка:', error);
        summaryText.textContent = 'Ошибка при суммаризации страницы: ' + error.message;
        loader.style.display = 'none';
      }
    }
  });
}