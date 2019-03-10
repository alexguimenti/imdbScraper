const request = require("request-promise");
const regularRequest = require("request");
const fs = require("fs");
const cheerio = require("cheerio");
const Nightmare = require("nightmare");
const nightmare = Nightmare({ show: true });
const ObjectsToCsv = require("objects-to-csv");

const sampleResult = {
  title: "Bohemian Rhapsody",
  rank: 1,
  imdbRating: 8.4,
  descriptionUrl:
    "https://www.imdb.com/title/tt0111161/?pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=e31d89dd-322d-4646-8962-327b42fe94b1&pf_rd_r=3VAGP5DW0FRXD5KV4QNW&pf_rd_s=center-1&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_tt_1",
  posterUrl: "https://www.imdb.com/title/tt0111161/mediaviewer/rm10105600",
  posterImageUrl:
    "https://m.media-amazon.com/images/M/MV5BZjFiMGNiNmItMzNiNi00Mjc1LTg1N2YtNWE2NTE5N2VlZTQ3XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SY1000_CR0,0,657,1000_AL_.jpg"
};

var progress = -1;

async function scrapeTitlesRanksAndRatings() {
  const result = await request.get(
    "https://www.imdb.com/chart/moviemeter?ref_=nv_mv_mpm"
  );
  const $ = await cheerio.load(result);

  const movies = $(
    "#main > div > span > div > div > div.lister > table > tbody > tr"
  )
    .map((i, element) => {
      const title = $(element)
        .find("td.titleColumn > a")
        .text();
      const descriptionUrl =
        "https://www.imdb.com" +
        $(element)
          .find("a")
          .attr("href");
      const imdbRating = $(element)
        .find("td.ratingColumn.imdbRating > strong")
        .text();

      return { title, imdbRating, rank: i + 1, descriptionUrl };
    })
    .get();
  return movies;
}

async function scrapePosterUrl(movies) {
  const moviesWithPosterUrl = await Promise.all(
    movies.map(async movie => {
      try {
        const htmlResult = await request.get(movie.descriptionUrl);
        const $ = await cheerio.load(htmlResult);
        movie.posterUrl =
          "https://www.imdb.com" + $("div.poster > a").attr("href");
        progress++;
        console.log(`Getting Titles... ${progress} %`);
        return movie;
      } catch (error) {
        //console.log(error);
      }
    })
  );
  return moviesWithPosterUrl;
}

async function getPosterImageUrl(movies) {
  for (var i = 0; i < movies.length; i++) {
    try {
      const posterImageUrl = await nightmare
        .goto(movies[i].posterUrl)
        .evaluate(() =>
          $(
            "#photo-container > div > div:nth-child(2) > div > div.pswp__scroll-wrap > div.pswp__container > div:nth-child(2) > div > img:nth-child(2)"
          ).attr("src")
        );
      console.log(`Getting Posters... ${i + 1} %`);
      movies[i].posterImageUrl = posterImageUrl;
      savePosterToDisk(movies[i]);
      //console.log(movies[i]);
    } catch (error) {
      console.log(error);
    }
  }

  return movies;
}

async function createCsvFile(data) {
  let csv = new ObjectsToCsv(data);

  // Save to file:
  await csv.toDisk("./test.csv");

  // Return the CSV file as string:
  //console.log(await csv.toString());
}

async function savePosterToDisk(movie) {
  regularRequest
    .get(movie.posterImageUrl)
    .pipe(fs.createWriteStream(`posters/${movie.rank}.png`));
}

async function scrapeImdb() {
  let movies = await scrapeTitlesRanksAndRatings();
  movies = await scrapePosterUrl(movies);
  movies = await getPosterImageUrl(movies);
  await createCsvFile(movies);
  console.log(movies);
}

scrapeImdb();
