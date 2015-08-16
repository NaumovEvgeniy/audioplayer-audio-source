var changeEQ; //глобальная переменная (должна инициироваться до загрузки скрипта для установления эквалайзера по умолчанию)

window.onload = function () {

    //проверяем поддержку браузера
    try {
        var audioContext = new (window.AudioContext || window.webkitAudioContext)(),
            reader = new FileReader(),
            audioPlayer = document.createElement('audio');

            /*  если браузер firefox, то выставляем crossOrigin в anonymous
                это сделано для того, чтобы файрфокс мог читать файлы, которые он не поддерживает.
                Стандартно он не поддерживает форматы mp3 и AAC.
                Мной было замеченно, что при выставление этой настройки, эти форматы воспроизводятся!
                Если убрать эту настройку, они не будут читаться.
                Было протестированно на разных компьютерах в последних версиях файрфокс
            */
            if(navigator.userAgent.indexOf('Firefox') === -1){
                audioPlayer.crossOrigin = "anonymous";
            }
        // добавляем <audio>
        document.body.appendChild(audioPlayer);
    } catch (e) {
        alert("Браузер не поддерживает WebAudio API...");
        return;
    }


    var file,
        //page = document.querySelector('.page'),
        html = document.querySelector('html'), //<html>
        dragzone = document.querySelector('.dragzone'), //блок drag 'n' drop
        inputFile = document.querySelector('.input-file'), //кнопка выбора файла на локальном диске
        artistField = document.querySelector('.song-info__artist'), // название артиста в плеере
        titleSondField = document.querySelector('.song-info__title'), // название песни в плеере
        songInfo = document.querySelector('.song-file'), // название проигрываемого файла в плеере

        playButton = document.querySelector('.player-controls__button_play'), // кнопка play
        stopButton = document.querySelector('.player-controls__button_stop'), // кнопка stop

        canvasCtx = document.querySelector('.visualization').getContext('2d'), // контекст canvas

        // определяем настройки эквалайзера
        frequencies = [70, 180, 320, 600, 1000, 3000, 6000, 12000, 14000, 16000],
        //уровни усиления для каждой частоты соответственно (количество должно совпадать с количеством частот)
        eqSettings = {
            'jazz': [5.1, 4.8, 4.4, 2.5, 1, 0, -1.7, -2.9, -4.4, -4.8],
            'classic': [0, 0, 0, 0, 0, 0, -4.8, -4.8, -4.8, -6.3],
            'rock': [4.8, 2.9, -3.6, -5.1, -2.5, 2.5, 5.6, 6.7, 6.7, 6.7],
            'pop': [-1.3, 2.9, 4.4, 4.8, 3.2, -1, -1.7, -1.7, -1.3, -1.3],
            'normal': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };




     //ОПРЕДЕЛЕНИЕ "КОНСТАНТ"

    var PLAY_BUTTON_CLASS = 'player-controls__button player-controls__button_play',
        PAUSE_BUTTON_CLASS = "player-controls__button player-controls__button_pause";

    //определения ошибок при работе плеера
    audioPlayer.onerror = function (e) {
        switch (e.target.error.code) {
            case 1:
                alert('fetching process aborted by user');
                break;
            case 2:
                alert('Произошла ошибка при загрузке файла!');
                break;
            case 3:
                alert('Произошла ошибка при декодирование файла!');
                break;
            case 4:
                alert('Формат не поддерживается браузером!');
                break;
        }
    };

    /*audioPlayer.ontimeupdate = function (e) {
        console.log(e);
    };*/


    //реализация drag n drop

    /*
     * как только файл перетаскивают в область <html>, блок dragzone увеличивается на все окно браузера. при
     * при покидание dragzone, блок становится невидимым (display: none)
     * */
    html.addEventListener('dragenter', dragToggle, false);
    dragzone.addEventListener('dragleave', dragToggle, false);
    dragzone.addEventListener('dragover', function (e) {
        e.preventDefault();
    }, false);
    dragzone.addEventListener('drop', dragzoneDrop, false);

    /*
     * при наведение на dragzone и <html>, dragzone принимает соответствующее оформление, иначе убирается
     * @param {object} e - событие
     * */
    function dragToggle(e) {
        e.preventDefault();
        dragzone.className = (e.type === 'dragenter' ? 'dragzone dragzone_hover' : 'dragzone');
    }

    /*
     * обработка "бросания файла в окно"
     * @param {object} e - событие
     * */
    function dragzoneDrop(e) {
        dragToggle(e);
        parseFile(e.dataTransfer.files[0]);
    }

    //реализация открытия файла через инпут

    inputFile.addEventListener('change', uploadFile, false)

    /*
     * событие выбора файла из проводника
     * @param {object} - event - событие изменения состояния кнопки input:file
     * */
    function uploadFile(e) {
        if(e.target.files[0]){
            file = e.target.files[0];
            parseFile(file);
        }
    }


    /*
     * сздание визуализатора
     * */
    function visualise () {
        WIDTH = canvasCtx.canvas.width;
        HEIGHT = canvasCtx.canvas.height;

        analyser.fftSize = 2048;
        var bufferLength = analyser.fftSize;
        console.log(bufferLength);
        var dataArray = new Uint8Array(bufferLength);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        function draw() {

            drawVisual = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(255, 255, 255)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

            canvasCtx.beginPath();

            var sliceWidth = WIDTH * 1.0 / bufferLength;
            var x = 0;

            for(var i = 0; i < bufferLength; i++) {

                var v = dataArray[i] / 128.0;
                var y = v * HEIGHT/2;

                if(i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvasCtx.canvas.width, canvasCtx.canvas.height/2);
            canvasCtx.stroke();
        };

        draw();

    }


    /*
     * конструктор, создающий n кол-во фильтров (указанно в переменной frequencies).
     * В качестве показателя частоты выступает элементы массива frequencies для каждого фильтра соответственно.
     * */
    function EQ () {

        var filters = [];
        frequencies.forEach(function (frequency){
            var filter = audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.gain.value = 0;
            filter.Q.value = 1;
            filter.frequency.value = frequency;

            filters.push(filter);
        });
        this.filters = filters;
    }

    /*
     * Прототип EQ для наследников EQ. Метод изменяет уровень усиления отдельного фильтра (частоты).
     * Количество значений усиления должно совпадать с значением количество фильтров (указанно в переменной frequencies)
     *
     * @param {array} gainsArray - массив уровня усиление для каждого фильтра (частоты).
     *                             Количество элементов массива должно совпадать с значением количество фильтров (указанно в переменной frequencies)
     * */
    EQ.prototype.changeGain = function (gainsArray) {
        var filters = this.filters;
        if(filters.length === gainsArray.length) {
            // в цикле меняем значения усиления каждой частоты
            for(var i = 0; i < filters.length && i < gainsArray.length; i++){
                filters[i].gain.value = gainsArray[i];
            }
        } else {
            throw new Error('Количество регулирования частот не совпадает с количеством регулирования уровня усиления');
        }
    };


    /*
     * подключение источника звука с созданным эквалайзером.
     * последовательное подключение источника с каждым из общего кол-ва созданных фильтров
     *
     * @param {object} source - источник звука
     * return - последний фильтр, который необходимо будет подключить со следующим модулем
     * */
    function connectWithEQ (source) {
        source.connect(equalize.filters[0]);
        equalize.filters.reduce(function (previousValue, currentValue) {
            previousValue.connect(currentValue);
            return currentValue;
        });
        return equalize.filters[equalize.filters.length - 1];
    }

    /*
     * изменение эквалайзеа по клику радио кнопки из html
     * переменная changeEQ записана в глобальной области видимости, для того, чтобы при клике на радио кнопку она была определена.
     *
     * @param {object} element - радио кнопка, по которой кликнули
     * @param {string} eq - название эквалайзера (данные требуемого эквалайзера берутся из переменной eqSettings)
     * */
    changeEQ = function (element, eq){
        var inputs = document.querySelector('.choose-equalizer').getElementsByTagName('label'); //получаем все кнопки эквалайзера

        // у всех кнопок удаляем стили активной кнопки
        for(var i = 0; i < inputs.length; i++){
            inputs[i].classList.remove('choose-equalizer__name_active');
        }

        var label;
        if(element.labels){
            label = element.labels[0];
        } else if(element.previousElementSibling.nodeName.toLocaleUpperCase() === 'LABEL') {
            label = element.previousElementSibling;
        } else {
            throw new Error("Не верен label для выбора эквалайзера");
        }

        label.classList.add('choose-equalizer__name_active'); //на выбранную кнопку добавляем активный класс
        equalize.changeGain(eqSettings[eq]);//меняем настройки эквалайзера
    };


    /*
     * определение типа файла и чтение информации из него (мета-данные, название трека) и передача файла на чтение его как аудиофайла (если он таковым является. если не аудиофайл, пишем ошибку)
     * читает мета-данные неофициальный порт (https://github.com/webcast/taglib.js) на javascript официальной библиотеки (http://id3.org/Implementations) для парсинга этих данных
     *
     * @param {object} file - принятый файл (методом drag 'n' drop или кнопкой "открыть")
     * */
    function parseFile(file){
        if(file.type.indexOf('audio') > -1){

            //читаем мета-данные
            file.readTaglibMetadata(file, function(data){
                var artist = 'Неизвестный исполнитель',
                    title = 'Неизвестная композиция';

                if('metadata' in data){
                    'artist' in data.metadata ? artist = data.metadata.artist : artist;
                    'title' in data.metadata ? title = data.metadata.title : title;
                }

                artistField.textContent = artist;
                titleSondField.textContent = title;
                songInfo.textContent = file.name;

                //читаем файл
                readFile(file);
            });
        } else {
            alert('Неверный формат!');
        }
    }


    /*
     *   чтение файла как аудиофайла
     *
     *   @param {object} file - принятый файл (передается после исполнения функции parseFile)
     * */
    function readFile(file) {

        //событие начала воспроизведения. кнопка play меняется на pause и вызавается визуализатор
        audioPlayer.onloadeddata = function (e) {
            playButton.className = PAUSE_BUTTON_CLASS;
            playButton.textContent = 'PAUSE';
            audioPlayer.play();
            visualise();
        };

        // событие окончания чтения файла как url и подставления url в источник <audio>
        reader.onloadend = function (e) {
            audioPlayer.src = e.target.result;
        };

        //читаем файл как url
        reader.readAsDataURL(file);

    }

    //события play, pause, stop
    playButton.addEventListener('click', playSong, false);
    stopButton.addEventListener('click', stopSong, false);

    /*
    * событие клика на кнопку pause/play
    * */
    function playSong() {
        //если нет песни в плеере, то открываем проводник
        if(!audioPlayer.src) {
            return inputFile.click();
        }

        //если кнопка была на паузе, то ставим ее на плэй
        if(this.className === PAUSE_BUTTON_CLASS) {
            this.className = PLAY_BUTTON_CLASS;
            this.textContent = 'PLAY';
            audioPlayer.pause();

        //если кнопка была на плэе, то ставим ее на паузу
        } else if (this.className === PLAY_BUTTON_CLASS) {
            this.className = PAUSE_BUTTON_CLASS;
            this.textContent = 'PAUSE';
            audioPlayer.play();

        // мало ли что :)
        } else {
            alert("Ошибка...");
        }

    }

    /*
    * событие клика на кнопку стоп
    * */
    function stopSong() {

        audioPlayer.pause(); //останавливаем воспроизведение
        audioPlayer.removeAttribute('src'); //отчищаем плеер от песни

        //меняем исполнителя, песню и имя файла на заглушки
        artistField.textContent = 'Артист';
        titleSondField.textContent = 'Название';
        songInfo.textContent = 'Проигрываемый файл';

        //ставим кнопку на плэй в любом случае
        playButton.className = PLAY_BUTTON_CLASS;
        playButton.textContent = 'PLAY';
    }


    var equalize = new EQ();
    var analyser = audioContext.createAnalyser();

    // установление эквалайзера по умолчанию
    document.getElementById('normalEQ').click();

    // создание источника звука (<audio>)
    var source = audioContext.createMediaElementSource(audioPlayer);

    // соединяем источник со всеми фильтрами, кроме последнего
    var lastFilter = connectWithEQ(source);

    //последний соединяем а анализатором
    lastFilter.connect(analyser);
    // на колонки
    analyser.connect(audioContext.destination);


};