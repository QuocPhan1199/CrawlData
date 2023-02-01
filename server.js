const cheerio = require('cheerio');
const download = require('image-downloader');
const request = require('request-promise');
const fs = require('fs');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


const keys = {
  'address': '所在地',
  'nearest_station': '最寄り駅',
  'initial_expenses': '初期費用',
  'monthly_rent': '月額賃料',
  'people_available': '利用可能人数',
  'area': '面積',
  'operating_company': '運営会社',
  'home_page': 'ホームページ',
  'phone_number': '電話番号',
  'fax_number': 'FAX番号',
  'business_hours': '営業時間',
  'office_form': 'オフィス形態',
  'right_to_buy': 'オプション'
};
var data = [];

request('https://rentaloffice-search.jp/search/?p=2', (error, response, html) => {
  if (!error && response.statusCode == 200) {
    const $ = cheerio.load(html);
    $('.result-office-list').each((index, el) => {
      getFormulaOneDrivers($(el).find('.result-office-nameUnit h2 a').attr("href"));
    })
  }
  else {
    console.log(error);
  }
});
async function getFormulaOneDrivers(url) {
  try {
    var dir = __dirname + `/images/${url.replace('/office', '')}/`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    let details = [];
    var galleries = [];
    let img = '';
    const response = await fetch(`https://rentaloffice-search.jp${url}`);
    const body = await response.text();
    const $ = cheerio.load(body);
    let office_data = {
      office_name: $('#office-detail').find("#office-detail-title").find('.detail-office-name').text().trim(),
      details: [],
      description: {
        label: $('#office-detail').find('#office-point-title').find('.detail-point-title').text().trim(),
        value: $('#office-detail').find("#detail-office-point").find('p').text().trim()
      },
      image: '',
      galleries: []
    }
    //Photo
    const photo = {
      url: `https://rentaloffice-search.jp/${$("#office-detail-module").find('.detail-office-image').find('.main-image img').attr("src")}`,
      dest: dir
    }
    async function downloadIMG() {
      try {
        const { filename, image } = await download.image(photo)
        img = filename.replace('E:\\Tizotech\\Crawl-Data\\', '');
        console.log(img);
      } catch (e) {
        console.error(e)
      }
    }
    await downloadIMG()
    // galleries
    $("#office-detail-module").find('.detail-office-image').find('.image-list li').each(async (index, el) => {
      const options = {
        url: `https://rentaloffice-search.jp/${$(el).find('a').attr("href")}`,
        dest: dir
      }
      async function downloadIMGGallery() {
        try {
          const { filename, image } = await download.image(options)
          galleries.push(filename.replace('E:\\Tizotech\\Crawl-Data\\', ''));
        } catch (e) {
          console.error(e)
        }
      }
      await downloadIMGGallery()
    })
    $('#office-detail').find('#office-detail-module tbody tr').each((index, el) => {
      details.push({
        key: Object.keys(keys).find(key => keys[key] === $(el).find('th').text()),
        label: $(el).find('th').text().trim(),
        value: $(el).find('td').text().trim()
      });
    });
    office_data.details = details;
    office_data.image = img;
    data.push(office_data)
    setTimeout(() => {
      office_data.galleries = galleries;
      fs.writeFileSync('data.json', JSON.stringify(data));
    }, 6000)
  } catch (error) {
    console.log(error);
  }
}




