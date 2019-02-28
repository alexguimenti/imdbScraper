const request = require("request-promise");
const cheerio = require("cheerio");

const sampleResult = {
  title: "Bohemian Rhapsody",
  rank: 1,
  imdbRating: 8.4,
  descriptionUrl:
    "https://www.imdb.com/title/tt0111161/?pf_rd_m=A2FGELUUNOQJNL&pf_rd_p=e31d89dd-322d-4646-8962-327b42fe94b1&pf_rd_r=3VAGP5DW0FRXD5KV4QNW&pf_rd_s=center-1&pf_rd_t=15506&pf_rd_i=top&ref_=chttp_tt_1",
  posterUrl: "https://www.imdb.com/title/tt0111161/mediaviewer/rm10105600"
};

async function scrapeTitlesRanksAndRatings() {
  const result = await request.get(
    "https://www.imdb.com/chart/moviemeter?ref_=nv_mv_mpm"
  );
  const $ = await cheerio.load(result);

  const movies = $("tr")
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

      return { title, imdbRating, rank: i, descriptionUrl };
      return movie;
    })
    .get();
  console.log(movies);
  return movies;
}

scrapeTitlesRanksAndRatings();