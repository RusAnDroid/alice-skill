// Для асинхронной работы используется пакет micro.
const { json } = require('micro');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

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
    let first_response_text = 'Я могу конвертировать сумму денег в количество дошиков (по 90г). Только скажите сумму и валюту. Пока что эта функция работает только с суммами в RUB, USD и EUR, так как мой разработчик - ленивая скотина)';
    let first_response_tts = 'Я могу конвертировать сумму денег в количество девяностограм+овых дошиков <[ d oo sh i k o f ]> sil <[350]> только скажите сумму и валюту sil <[350]> пока что эта функция работает только с суммами в рубл+ях sil <[150]> д+олларах и +евро sil <[170]> так как мой разработчик sil <[120]> ленивая скотина)';
    
    let help_text = 'Назовите мне сумму и валюту, а я вам скажу, сколько девяностограммовых дошиков можно купить на эти деньги.';
    let help_tts = 'назовите мне сумму и валюту sil <[200]> а я вам скажу sil <[200]> сколько девяностограм+овых дошиков <[ d oo sh i k o f ]> можно купить на эти д+еньги';

    let usd_in = false;
    let eur_in = false;
    let rub_in = false;
    let token_pos = 0;
    let usd_flag = false;
    
    let tokens_arr;
    
    let dont_understand_text = 'Извините, я Вас не понимаю.';
    let dont_understand_tts = 'извин+ите sil <[200]> я вас не поним+аю';
    
    let xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://www.cbr-xml-daily.ru/daily_json.js', true);
    xhr.timeout = 3000;
    xhr.onreadystatechange = function () {
        if(xhr.readyState == 4) {
            if (xhr.status == 200) {
                let valute_obj = JSON.parse(xhr.responseText);
                let usd_coef = Math.floor(valute_obj.Valute.USD.Value);
                let eur_coef = Math.floor(valute_obj.Valute.EUR.Value);
                if (request.original_utterance == "") {
                    response_text = first_response_text;
                    response_tts = first_response_tts;
                } else if (request.original_utterance.toLowerCase() == "что ты можешь" || request.original_utterance.toLowerCase() == "что ты умеешь" || request.original_utterance.toLowerCase() == "что ты можешь?" || request.original_utterance.toLowerCase() == "что ты умеешь?" || request.original_utterance.toLowerCase() == "помощь" || request.original_utterance.toLowerCase() == "помоги" || request.command.toLowerCase() == "помоги пожалуйста" || request.original_utterance.toLowerCase() == "помощь." || request.original_utterance.toLowerCase() == "помощь!" || request.original_utterance.toLowerCase() == "помоги!" || request.original_utterance.toLowerCase() == "помоги" || request.command.toLowerCase() == "помоги пожалуйста.") {
                    response_text = help_text;
                    response_tts = help_tts;
                } else {
                    tokens_arr = toArr(request.command);

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
                            eur_in = true;
                            token_pos = cnt;
                        }
                        cnt += 1;
                    }

                    if (token_pos == 0 && !usd_flag) {
                        response_text = dont_understand_text;
                        response_tts = dont_understand_tts;
                    } else if (!usd_in && !eur_in && !rub_in) {
                        response_text = dont_understand_text;
                        response_tts = dont_understand_tts;
                    } else if (usd_in && eur_in || usd_in && rub_in || eur_in && rub_in) {
                        response_text = dont_understand_text;
                        response_tts = dont_understand_tts;
                    } else if (!usd_flag && (tokens_arr[token_pos - 1].replace(/\s/g, '').length === 0 || isNaN(tokens_arr[token_pos - 1]))) { // Ето проверка на NaN
                        response_text = dont_understand_text; 
                        response_tts = dont_understand_tts;
                    } else if (token_pos == 0 && tokens_arr[0] == '$') {
                        response_text = dont_understand_text;
                        response_tts = dont_understand_tts;
                    } else if (rub_in) {
                        let sum = tokens_arr[token_pos - 1];
                        response_text = 'Учитывая среднестатистическую цену девяностограммового дошика (35 рублей), ' + sum + ' ';
                        response_tts = 'учитывая среднестатист+ическую цену девяностограм+ового дошика <[ d oo sh i k a ]> sil <[150]> 35 рубл+ей sil <[200]> ' + sum;
                        if (sum % 100 > 4 && sum % 100 < 21) {
                            response_text += 'рублей';
                            response_tts += 'рубл+ей';
                        } else if (sum % 10 == 0) {
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
                        } else {
                            response_text += 'рублей';
                            response_tts += 'рубл+ей';
                        }
                        let num = Math.floor(sum / 35);
                        response_text += ' - это примерно ' + num + ' ';
                        response_tts += ' sil <[120]> это прим+ерно ' + num + ' ';
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
                        } else {
                            response_text += 'дошиков.';
                            response_tts += 'дошиков <[ d oo sh i k o f ]>';
                        }
                    } else if (usd_in) {
                        let sum;
                        if (!usd_flag) {
                            sum = tokens_arr[token_pos - 1];
                        } else {
                            sum = request.nlu.tokens[token_pos];
                        }
                        response_text = 'Учитывая среднестатистическую цену девяностограммового дошика (35 рублей) и курс USD к RUB по данным ЦБ РФ (1$ - ' + usd_coef + ' ';
                        response_tts = 'учитывая среднестатист+ическую цену девяностограм+ового дошика <[ d oo sh i k a ]> sil <[150]> 35 рубл+ей sil <[150]> и курс д+оллара к рубл+ю по данным центрального банка российской федерации sil <[150]> од+ин д+оллар sil <[120]> ' + usd_coef + ' ';
                        if (usd_coef % 100 > 4 && usd_coef % 100 < 21) {
                            response_text += 'рублей';
                            response_tts += 'рубл+ей';
                        } else if (usd_coef % 10 == 0) {
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
                        } else {
                            response_text += 'рублей';
                            response_tts += 'рубл+ей';
                        }
                        response_text += '), ' + sum + '$ ';
                        response_tts += ' sil <[350]> ' + sum + ' ';
                        if (sum % 100 > 4 && usd_coef % 100 < 21) {
                            response_tts += 'д+олларов';
                        } else if (sum % 10 == 0) {
                            response_tts += 'д+олларов';    
                        } else if (sum % 10 < 1) {
                            response_tts += 'д+оллара';
                        } else if (sum % 10 == 1) {
                            response_tts += 'д+оллар';
                        } else if (sum % 10 < 5) {
                            response_tts += 'д+оллара';
                        } else {
                            response_tts += 'д+олларов';
                        }
                        let num = Math.floor(sum * usd_coef / 35);
                        response_text += ' - это примерно ' + num + ' ';
                        response_tts += ' sil <[120]> это прим+ерно ' + num + ' ';
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
                        } else {
                            response_text += 'дошиков.';
                            response_tts += 'дошиков <[ d oo sh i k o f ]>';
                        }
                    } else if (eur_in) {
                        let sum = tokens_arr[token_pos - 1];
                        response_text = 'Учитывая среднестатистическую цену девяностограммового дошика (35 рублей) и курс EUR к RUB по данным ЦБ РФ (1 евро - ' + eur_coef + ' ';
                        response_tts = 'учитывая среднестатист+ическую цену девяностограм+ового дошика <[ d oo sh i k a ]> sil <[150]> 35 рубл+ей sil <[150]> и курс +евро к рубл+ю по данным центрального банка российской федерации sil <[150]> одно +евро sil <[120]>' + eur_coef + ' ';
                        if (eur_coef % 100 > 4 && eur_coef % 100 < 21) {
                            response_text += 'рублей';
                            response_tts += 'рубл+ей';
                        } else if (eur_coef % 10 == 0) {
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
                        } else {
                            response_text += 'рублей';
                            response_tts += 'рубл+ей';
                        }
                        response_text += '), ' + sum + ' евро ';
                        response_tts += ' sil <[170]> ' + sum + ' +евро ';
                        let num = Math.floor(sum  * eur_coef / 35);
                        response_text += ' - это примерно ' + num + ' ';
                        response_tts += ' sil <[120]> это прим+ерно ' + num + ' ';
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
                        } else {
                            response_text += 'дошиков.';
                            response_tts += 'дошиков <[ d oo sh i k o f ]>';
                        }
                    }
                }
            } else {
                response_text = 'Извините, ошибка соединения с серверами.';
                response_tts = 'извин+ите sil <[200]> ошибка соедин+ения с сервер+ами';
            }
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
        }
    };
    xhr.send(null);
};
