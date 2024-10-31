const puppeteer = require('puppeteer');
const opn = require('opn');
const fetch = require('node-fetch');
const { exec } = require("child_process");

const bot_token = '1870687700:AAH96QsvHMdasTVCF8FQ74tgqJH2kA0oZ3I';
const chat_id = '1895442791';

const send_telegram_msg = (message) => {
    const params = {
        'bot_token': bot_token,
        'chat_id': chat_id,
        'text': message,
    };
    var url = new URL(`https://api.telegram.org/bot${bot_token}/sendMessage`);
    url.search = new URLSearchParams(params).toString();
    fetch(url).then((res) => res.json()).then((res) => console.log(res))
    .catch((err) => console.log("Error trying sending msg to telegram"));
}

const play_sound = () => {
    exec("start sound.mp3", (error, stdout, stderr) => {
      if (error) {
          console.log(`error in sound playing: ${error.message}`);
          return;
      }
    });
}

const shuffle = (array) => {
    return array.sort(() => Math.random() - 0.5);
}

var years_filets = ['',];
for (let i = 1960; i <= 1985; i++)
    years_filets.push(i.toString());

const filters = {
    "[name=model_year_min]": years_filets,
    "[name=price_min]": ["", "100"],
    "[name=sort]": ["created_time|desc", "created_time|asc", "price|asc"],
};

var filters_list = {
    '1': years_filets.map((item) => ["[name=model_year_min]",item.toString()]).concat([["[name=model_year_min]", ""]]),
    '2': [["[name=price_min]",""], ["[name=price_min]","100"]],
    '3': [["[name=sort]", "created_time|desc"], ['[name=sort]','created_time|asc'], ["[name=sort]","price|asc"], ["[name=sort]", ""]]
};

var varios_filters = [];
filters_list['1'].forEach((item) => {
    filters_list['2'].forEach((item2) => {
        filters_list['3'].forEach((item3) => {
            varios_filters.push([item, item2, item3]);
        });
    });
});

console.log("AMOUNT OF COMBINATIONS", varios_filters.length);
const s_filters = shuffle(varios_filters);
console.log(s_filters);

const Parser = async () => {
    var memory = [];
    const browser = await puppeteer.launch({headless: true, defaultViewport: null, args: ['--incognito'],});
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.goto("https://www.vaurioajoneuvo.fi/?condition=no_demo");
    send_telegram_msg("STARTING PARSER");

    page.on('console', msg => {
        for (let i = 0; i < msg._args.length; ++i)
          console.log(`${msg._args[i]}`);
    });
    
    while (true) {
        for (let f of Object.keys(filters)) {
            for (let i of filters[f]) {
                await page.select(f, i);
                let result_of_scraping = await page.evaluate((memory) => {
                    var elems = [];
                    var new_data = [];
                    document.querySelectorAll(".item-lift-container a").forEach((item) => elems.push(item.href));
                    if (memory.length == 0) {
                        memory = elems;
                    } else {
                        new_data = elems.filter(x => !memory.includes(x));
                        memory = memory.concat(new_data); // добавляем новые элементы в массив
                        console.log(`got ${elems.length} elements, new items ${new_data.length}. So, memory length is ${memory.length}`);
                    };
                    return { 
                        "status": "OK",
                        "memory": memory,
                        "new_items": new_data,
                    };
                }, memory).catch((err) => {
                    console.log("ERROR TRYING PAGE EVALUATE", err);
                    return {"status": "FAIL", "error": err};
                });


                if (result_of_scraping['status'] == "OK") {
                    memory = result_of_scraping['memory'];
                    if (result_of_scraping['new_items'].length) {
                        result_of_scraping['new_items'].forEach(item => { // для каждого элемента открываем окно браузера
                            //opn(item);
                            //play_sound();
                            send_telegram_msg(item);
                            //send_telegram_msg("New item!\n" + item);
                        });
                    }
                } else {
                    await page.waitForTimeout(100000);
                    send_telegram_msg("I got an error!\n" + result_of_scraping['error']);
                    send_telegram_msg("I will wait for 100 secs and try again");
                }

                await page.waitForTimeout(18000); // oli 3000
            }
        }
    }
};

const NewParser = async () => {
    var memory = [];
    const browser = await puppeteer.launch({headless: true, defaultViewport: null, args: ['--incognito'],});
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.goto("https://www.vaurioajoneuvo.fi/?condition=no_demo");
    send_telegram_msg("STARTING PARSER");

    page.on('console', msg => {
        for (let i = 0; i < msg._args.length; ++i)
          console.log(`${msg._args[i]}`);
    });
    
    while (true) {
        for (let i = 0; i < s_filters.length; i++) {
            for (let j = 0; j < s_filters[i].length; j++) {
                await page.select(s_filters[i][j][0], s_filters[i][j][1]);
            }
            let result_of_scraping = await page.evaluate((memory) => {
                var elems = [];
                var new_data = [];
                document.querySelectorAll(".item-lift-container a").forEach((item) => elems.push(item.href));
                if (memory.length == 0) {
                    memory = elems;
                } else {
                    new_data = elems.filter(x => !memory.includes(x));
                    memory = memory.concat(new_data); // добавляем новые элементы в массив
                    console.log(`got ${elems.length} elements, new items ${new_data.length}. So, memory length is ${memory.length}`);
                };
                return { 
                    "status": "OK",
                    "memory": memory,
                    "new_items": new_data,
                };
            }, memory).catch((err) => {
                console.log("ERROR TRYING PAGE EVALUATE", err);
                return {"status": "FAIL", "error": err};
            });


            if (result_of_scraping['status'] == "OK") {
                memory = result_of_scraping['memory'];
                if (result_of_scraping['new_items'].length) {
                    result_of_scraping['new_items'].forEach(item => { // для каждого элемента открываем окно браузера
                        //opn(item);
                        //play_sound();
                        send_telegram_msg(item);
                        //send_telegram_msg("New item!\n" + item);
                    });
                }
            } else {
                await page.waitForTimeout(100000);
                send_telegram_msg("I got an error!\n" + result_of_scraping['error']);
                send_telegram_msg("I will wait for 100 secs and try again");
            }

            await page.waitForTimeout(18000); // oli 3000
        }
    }
};

NewParser();
// Parser();
// Можно перемешать элементы массива. Сджойнить ключ и значение


// Указать путь к chrome executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
// const puppeteer = require('puppeteer-core'); // будет запуск из Microsoft Edge


// CAPTCHA
{/* <section class="content">
  <div class="container">
    <div class="breadtext">
  <h2>Tarkistamme ajoittain, että kävijämme ovat ihmisiä.</h2>
<p>Ole hyvä ja todista olevasi hiilipohjainen elämänmuoto:</p>
</div>
<form method="post" action="/captcha/">
  <input type="hidden" name="cm_token" value="cAqlRyNVmQd2O7oZCAXIFHP8rL8O0pJpQ6OpYGW_ViQ" />
  <script src="https://www.google.com/recaptcha/api.js?hl=fi" async defer></script>
<div class="g-recaptcha" data-sitekey="6LfhPykaAAAAAE3uIktN-nrSE_-d5mFILs-rthdG" ></div>
  <button class="button" type="submit">Vahvista</button>
</form>

  </div>
</section> */}
