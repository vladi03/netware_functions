import torahMosaicReportVladMartinez from './articles/torah-mosaic-report-vlad-martinez.txt?raw';
import john3112ExegeticalAnalysis from './articles/john-3-1-12-an-exegetical-analysis.txt?raw';

export const articles = [
  {
    slug: 'john-3-1-12-an-exegetical-analysis',
    title: 'John 3:1-12 An Exegetical Analysis',
    author: 'Vladimir Martinez',
    published: 'March 5, 2025',
    abstract:
      "This paper examines Jesus' night conversation with Nicodemus in John 3:1-12 and argues that spiritual regeneration is the central message of the passage. It situates the encounter within John's Gospel narrative and the broader conflict between Jesus and Israel's religious leadership. The essay traces Old Testament links, especially Ezekiel's promise of cleansing and new heart language, to show why Jesus expected Nicodemus to understand new birth themes. It also analyzes Jesus' rhetorical strategy, including His emphatic statements and witness language, as a direct challenge to self-reliant religion. The theological conclusion is that rebirth by the Holy Spirit is necessary for salvation and remains foundational for Christian holiness and assurance. A full bibliography and source footnotes are included in the published article text.",
    readingMinutes: '16 min read',
    audioSrc: '/audio/john-3-1-12-an-exegetical-analysis.mp3',
    body: john3112ExegeticalAnalysis,
  },
  {
    slug: 'torah-mosaic-report-vlad-martinez',
    title: 'Review: "The Torah Mosaic" by Tracy J. McKenzie',
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
