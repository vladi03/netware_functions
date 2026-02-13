import torahMosaicReportVladMartinez from './articles/torah-mosaic-report-vlad-martinez.txt?raw';

export const articles = [
  {
    slug: 'torah-mosaic-report-vlad-martinez',
    title: 'Torah Mosaic Report',
    author: 'Vlad Martinez',
    published: 'February 13, 2026',
    abstract:
      "This report argues that the Torah presents a coherent theological message rather than isolated historical fragments. It highlights how the Pentateuch frames humanity's calling, fall, and ongoing need for restoration under God's covenant purposes. The essay emphasizes key themes including mediation, atonement, divine transcendence and nearness, and the mission of God's people among the nations. It also traces how promises to Abraham and later developments in Moses and Deuteronomy point forward to future fulfillment. A central claim is that the Torah should be read as a forward-looking witness, not merely a record of past events. The article concludes that the unifying message of these books is God's desire to make His name known through judgment, salvation, and covenant faithfulness.",
    readingMinutes: '7 min read',
    audioSrc: '/audio/torah-mosaic-report-vlad-martinez.mp3',
    body: torahMosaicReportVladMartinez,
  },
];

export const getArticleBySlug = (slug) =>
  articles.find((article) => article.slug === slug);
