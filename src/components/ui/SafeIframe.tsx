'use client';

import React, { useEffect, useRef, useState } from 'react';

interface SafeIframeProps {
    html: string;
    className?: string;
}

export function SafeIframe({ html, className }: SafeIframeProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [height, setHeight] = useState('200px');

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe) return;

        const handleLoad = () => {
            if (!iframe.contentWindow) return;
            const doc = iframe.contentDocument || iframe.contentWindow.document;
            if (!doc) return;

            // Inject content
            doc.open();
            doc.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            font-size: 14px;
                            line-height: 1.5;
                            color: #1a1a1a;
                            word-break: break-word;
                        }
                        img { max-width: 100%; height: auto; }
                        a { color: #2563eb; text-decoration: underline; }
                        blockquote {
                            margin: 0 0 0 .8ex;
                            border-left: 1px #999 solid;
                            padding-left: 1ex;
                        }
                        .gmail_quote_toggle {
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            width: 32px;
                            height: 24px;
                            background-color: #f3f4f6;
                            border: 1px solid #d1d5db;
                            border-radius: 4px;
                            cursor: pointer;
                            margin: 8px 0;
                            color: #6b7280;
                            font-weight: bold;
                            font-size: 12px;
                        }
                        .gmail_quote { display: none; }
                    </style>
                </head>
                <body>
                    <div id="content">${html}</div>
                    <script>
                        function updateHeight() {
                            const h = document.documentElement.scrollHeight;
                            window.parent.postMessage({ type: 'resize', height: h }, '*');
                        }

                        function setupQuotes() {
                            const content = document.getElementById('content');
                            let firstQuote = content.querySelector('.gmail_quote');
                            if (!firstQuote) firstQuote = content.querySelector('blockquote');

                            if (firstQuote && !firstQuote.dataset.processed) {
                                firstQuote.dataset.processed = 'true';
                                firstQuote.style.display = 'none';
                                const btn = document.createElement('div');
                                btn.className = 'gmail_quote_toggle';
                                btn.innerHTML = '•••';
                                btn.onclick = () => {
                                    const isHidden = firstQuote.style.display === 'none';
                                    firstQuote.style.display = isHidden ? 'block' : 'none';
                                    btn.innerHTML = isHidden ? 'CLOSE' : '•••';
                                    btn.style.fontSize = isHidden ? '8px' : '12px';
                                    updateHeight();
                                };
                                firstQuote.parentNode.insertBefore(btn, firstQuote);
                            }
                        }

                        document.addEventListener('click', (e) => {
                            const target = e.target.closest('a');
                            if (target) {
                                target.target = '_blank';
                                target.rel = 'noopener noreferrer';
                            }
                        });

                        setupQuotes();
                        window.addEventListener('load', updateHeight);
                        new ResizeObserver(updateHeight).observe(document.body);
                    </script>
                </body>
                </html>
            `);
            doc.close();
        };

        iframe.addEventListener('load', handleLoad);

        // Initial trigger for srcdoc or about:blank
        if (iframe.contentWindow?.document.readyState === 'complete') {
            handleLoad();
        }

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'resize' && event.data?.height) {
                setHeight(`${event.data.height}px`);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => {
            iframe.removeEventListener('load', handleLoad);
            window.removeEventListener('message', handleMessage);
        };
    }, [html]);

    return (
        <iframe
            ref={iframeRef}
            className={className}
            style={{ width: '100%', height, border: 'none', overflow: 'hidden' }}
            title="Email Content"
            sandbox="allow-popups allow-popups-to-escape-sandbox allow-scripts allow-same-origin"
        />
    );
}
