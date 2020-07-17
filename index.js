// Для асинхронной работы используется пакет micro.
const { json } = require('micro');

// Запуск асинхронного сервиса.
module.exports = async (req, res) => {

    const { request, session, version } = await json(req);
    
    let response_text, response_tts;
    let first_response_text = 'Что мне конвертировать в количество дошиков (по 90г)? Пока что эта функция работает только с суммами в RUB, USD и EUR, так как мой разработчик - ленивая скотина)';
    let first_response_tts = 'что+ мне конверт+ировать в количество девян+о стограм+овых дошиков <[ d oo sh i k o f ]> sil <[650]> пока что эта ф+ункция раб+отает т+олько с с+умами в рубл+ях sil <[200]> д+оларах и евр+о sil <[300]> так как мой разраб+очик sil <[500]> лен+ивая скот+ина'
    
    bool usd_in = false, eur_in = false, rub_in = false;
    let token_pos = 0;

    if (request.original_utterance == null) {
        response_text = first_response_text;
        response_tts = first_response_tts;
    } else {
        let tokens_arr = request.nlu.tokens;
    
        let cnt = 0;
        for (let token of tokens_arr) {
            if (token == '$') {
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
        
        if (cnt == 0) {
            response_text = dont_understand_text;
            response_tts = dont_understand_tts;
        } else if (usd_in && eur_in || usd_in && rub_in || eur_in && rub_in) {
            response_text = dont_understand_text;
            response_tts = dont_understand_tts;
        } else if (rub_in) {
            if (tokens_arr[cnt - 1].replace(/\s/g, '').length === 0 || isNaN(tokens_arr[cnt - 1])) {
                response_text = dont_understand_text;
                response_tts = dont_understand_tts;
            } else {
                let sum = tokens_arr[cnt - 1];
                response_text = 'Учитывая среднестатистическую цену девяностограммового дошика - 35 рублей, ' + sum + ' ';
                response_tts = 'учи+тывая средн+е статист+ическую цену девян+о стограм+ового дошика <[ d oo sh i k a ]> sil <[500]> 35 рубл+ей sil <[200]>' + sum;
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
                let num = sum / 35;
                response_text += ' - это примерно ' + num;
                response_tts += ' sil <[500]> это прим+ерно ' + num;
                if (sum % 100 > 4 && sum % 100 < 21) {
                    response_text += 'дошиков';
                    response_tts += 'дошиков <[ d oo sh i k o f ]>';
                } else if (sum % 10 == 1) {
                    response_text += 'дошик';
                    response_tts += 'дошик <[ d oo sh i k ]>';
                } else if (sum % 10 < 5) {
                    response_text += 'дошика';
                    response_tts += 'дошика <[ d oo sh i k a ]>';
                }
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
