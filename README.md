# http://naumov-shri.ru/3-audio-source

В отличие от первой реализации (http://naumov-shri.ru/3-buffer-source) здесь реализована пауза песни и постепенная буфферизация, чего нет в первоначальной реализации.

Использование <audio> гарантирует работоспособность плеера, потому что все браузеры, поддерживающие <audio>, поддерживают и Web Audio API.
