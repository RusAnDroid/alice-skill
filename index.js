// Для асинхронной работы используется пакет micro.
const { json } = require('micro');

function toArr(str) {
    let sub = '';
    let arr = [];
    for (let chr of str) {
        if (chr == ' ') {
            arr.push(sub);
            sub = '';
        } else {
            sub += chr;
        }
    }
    arr.push(sub);
    return arr;
}

// Запуск асинхронного сервиса.
module.exports = async (req, res) => {

    const { request, session, version } = await json(req);

    let response_text, response_tts;
    let first_response_text = 'Что мне конвертировать в количество дошиков (по 90г)? Пока что эта функция работает только с суммами в RUB, USD и EUR, так как мой разработчик - ленивая скотина)';
    let first_response_tts = 'что+ мне конверт+ировать в количество девян+о стограм+овых дошиков <[ d oo sh i k o f ]> sil <[650]> пока что эта ф+ункция раб+отает т+олько с с+уммами в рубл+ях sil <[200]> д+олларах и +евро sil <[300]> так как мой разраб+отчик sil <[500]> лен+ивая скот+ина';

    let usd_in = false;
    let eur_in = false;
    let rub_in = false;
    let token_pos = 0;
    let usd_flag = false;
    
    if (request.original_utterance == "") {
        response_text = first_response_text;
        response_tts = first_response_tts;
    } else {
        let tokens_arr = toArr(request.command);

        let cnt = 0;
        for (let chr of request.command) {
            if (chr == ' ') cnt += 1;
            if (chr == '$') {
                usd_in = true;
                token_pos = cnt;
                usd_flag = true;
            }
        }
        cnt = 0;
        for (let token of tokens_arr) {
            if (token == 'доллар' || token == 'долларов' || token == 'доллара') {
                usd_in = true;
                token_pos = cnt;
            }
            if (token == 'р' || token == 'рубля' || token == 'рублей' || token == 'рубль') {
                rub_in = true;
                token_pos = cnt;
            }
            if (token == 'евро') {
                eur_in == true;
                token_pos = cnt;
            }
            cnt += 1;
        }

        let dont_understand_text = 'Извините, я Вас не понимаю.';
        let dont_understand_tts = 'извин+ите sil <[200]> я вас не поним+аю.';

        if (token_pos == 0) {
            response_text = dont_understand_text;
            response_tts = dont_understand_tts;
        } else if (!usd_in && !eur_in && !rub_in) {
            response_text = dont_understand_text;
            response_tts = dont_understand_tts;
        } else if (usd_in && eur_in || usd_in && rub_in || eur_in && rub_in) {
            response_text = dont_understand_text;
            response_tts = dont_understand_tts;
        } else if (tokens_arr[token_pos - 1].replace(/\s/g, '').length === 0 || isNaN(tokens_arr[token_pos - 1])) {
            response_text = dont_understand_text;
            response_tts = dont_understand_tts;
        } else if (rub_in) {
            let sum = tokens_arr[token_pos - 1];
            response_text = 'Учитывая среднестатистическую цену девяностограммового дошика - 35 рублей, ' + sum + ' ';
            response_tts = 'учи+тывая средн+е статист+ическую цену девян+о стограм+ового дошика <[ d oo sh i k a ]> sil <[500]> 35 рубл+ей sil <[200]> ' + sum;
            if (sum % 100 > 4 && sum % 100 < 21) {
                response_text += 'рублей';
                response_tts += 'рубл+ей';
            } else if (sum % 10 < 1) {
                response_text += 'рубля';
                response_tts += 'рубл+я';
            } else if (sum % 10 == 1) {
                response_text += 'рубль';
                response_tts += 'р+убль';
            } else if (sum % 10 < 5) {
                response_text += 'рубля';
                response_tts += 'рубл+я';
            }
            let num = Math.floor(sum / 35);
            response_text += ' - это примерно ' + num + ' ';
            response_tts += ' sil <[500]> это прим+ерно ' + num + ' ';
            if (num % 100 > 4 && num % 100 < 21) {
                response_text += 'дошиков.';
                response_tts += 'дошиков <[ d oo sh i k o f ]>';
            } else if (num % 10 == 0) {
                response_text += 'дошиков.';
                response_tts += 'дошиков <[ d oo sh i k o f ]>';
            } else if (num % 10 == 1) {
                response_text += 'дошик.';
                response_tts += 'дошик <[ d oo sh i k ]>';
            } else if (num % 10 < 5) {
                response_text += 'дошика.';
                response_tts += 'дошика <[ d oo sh i k a ]>';
            }
        } else {
            let xhr = new XMLHttpRequest();
            xhr.open('GET', 'https://www.cbr-xml-daily.ru/daily_json.js', false);
            //xhr.timeout = 3000;
            xhr.send();
            if (xhr.status == 200) {
                let valute_obj = JSON.parse(xhr.responseText);
                let usd_coef = Math.floor(valute_obj.Valute.USD.Value);
                let eur_coef = Math.floor(valute_obj.Valute.EUR.Value);
                if (usd_in) {
                    let sum;
                    if (!usd_flag) sum = tokens_arr[token_pos - 1];
                    else {
                        sum = tokens_arr[token_pos];
                        sum.pop();
                    }
                    response_text = 'Учитывая среднестатистическую цену девяностограммового дошика - 35 рублей, ' + sum + ' и курс USD к RUB по данным ЦБ РФ: 1$ - ' + usd_coef + ' ';
                    response_tts = 'учи+тывая средн+е статист+ическую цену девян+о стограм+ового дошика <[ d oo sh i k a ]> sil <[500]> 35 рубл+ей sil <[200]> ' + sum + ' и курс д+оллара к рубл+ю по д+анным центр+ального б+анка эр эф sil <[500]> од+ин д+оллар sil <[500]> ' + usd_coef + ' ';
                    if (usd_coef % 100 > 4 && usd_coef % 100 < 21) {
                        response_text += 'рублей';
                        response_tts += 'рубл+ей';
                    } else if (usd_coef % 10 < 1) {
                        response_text += 'рубля';
                        response_tts += 'рубл+я';
                    } else if (usd_coef % 10 == 1) {
                        response_text += 'рубль';
                        response_tts += 'р+убль';
                    } else if (usd_coef % 10 < 5) {
                        response_text += 'рубля';
                        response_tts += 'рубл+я';
                    }
                    response_text += ', ' + sum + '$ ';
                    response_tts += ' sil <[200]> ' + sum + ' ';
                    if (usd_coef % 100 > 4 && usd_coef % 100 < 21) {
                        response_tts += 'д+олларов';
                    } else if (usd_coef % 10 < 1) {
                        response_tts += 'д+олларов';
                    } else if (usd_coef % 10 == 1) {
                        response_tts += 'д+оллар';
                    } else if (usd_coef % 10 < 5) {
                        response_tts += 'д+оллара';
                    }
                    let num = Math.floor(sum / 35) * usd_coef;
                    response_text += ' - это примерно ' + num + ' ';
                    response_tts += ' sil <[500]> это прим+ерно ' + num + ' ';
                    if (num % 100 > 4 && num % 100 < 21) {
                        response_text += 'дошиков.';
                        response_tts += 'дошиков <[ d oo sh i k o f ]>';
                    } else if (num % 10 == 0) {
                        response_text += 'дошиков.';
                        response_tts += 'дошиков <[ d oo sh i k o f ]>';
                    } else if (num % 10 == 1) {
                        response_text += 'дошик.';
                        response_tts += 'дошик <[ d oo sh i k ]>';
                    } else if (num % 10 < 5) {
                        response_text += 'дошика.';
                        response_tts += 'дошика <[ d oo sh i k a ]>';
                    }
                } else {
                    let sum = tokens_arr[token_pos - 1];
                    response_text = 'Учитывая среднестатистическую цену девяностограммового дошика - 35 рублей, ' + sum + ' и курс EUR к RUB по данным ЦБ РФ: 1 евро - ' + eur_coef + ' ';
                    response_tts = 'учи+тывая средн+е статист+ическую цену девян+о стограм+ового дошика <[ d oo sh i k a ]> sil <[500]> 35 рубл+ей sil <[200]> ' + sum + ' и курс +евро к рубл+ю по д+анным центр+ального б+анка эр эф sil <[500]> одн+о +евро sil <[500]>' + eur_coef + ' ';
                    if (eur_coef % 100 > 4 && eur_coef % 100 < 21) {
                        response_text += 'рублей';
                        response_tts += 'рубл+ей';
                    } else if (eur_coef % 10 < 1) {
                        response_text += 'рубля';
                        response_tts += 'рубл+я';
                    } else if (eur_coef % 10 == 1) {
                        response_text += 'рубль';
                        response_tts += 'р+убль';
                    } else if (eur_coef % 10 < 5) {
                        response_text += 'рубля';
                        response_tts += 'рубл+я';
                    }
                    response_text += ', ' + sum + ' евро ';
                    response_tts += ' sil <[200]> ' + sum + ' +евро ';
                    let num = Math.floor(sum / 35) * eur_coef;
                    response_text += ' - это примерно ' + num + ' ';
                    response_tts += ' sil <[500]> это прим+ерно ' + num + ' ';
                    if (num % 100 > 4 && num % 100 < 21) {
                        response_text += 'дошиков.';
                        response_tts += 'дошиков <[ d oo sh i k o f ]>';
                    } else if (num % 10 == 0) {
                        response_text += 'дошиков.';
                        response_tts += 'дошиков <[ d oo sh i k o f ]>';
                    } else if (num % 10 == 1) {
                        response_text += 'дошик.';
                        response_tts += 'дошик <[ d oo sh i k ]>';
                    } else if (num % 10 < 5) {
                        response_text += 'дошика.';
                        response_tts += 'дошика <[ d oo sh i k a ]>';
                    }
                }
            } else {
                response_text = 'Извините, ошибка соединения с Центральным Банком РФ.';
                response_tts = 'извин+ите sil <[200]> ошибка соедин+ения с центр+альным б+анком эр эф';
            }
        }
    }

    
    // В тело ответа вставляются свойства version и session из запроса.
    res.end(JSON.stringify(
        {
            version,
            session,
            response: {
                text: response_text,
                tts: response_tts,

                // Свойство response.end_session возвращается со значением true,
                // чтобы диалог завершился.
                end_session: true,
            },
        }
    ));
};
