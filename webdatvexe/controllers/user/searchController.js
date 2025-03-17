const Search = require('../../models/Search');

exports.showSearchForm = async (req, res) => {
  try {
    const { fromLocations, toLocations } = await Search.getLocations();
    res.render('user/search', {
      title: 'Tìm chuyến xe',
      fromLocations,
      toLocations,
      results: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};

exports.search = async (req, res) => {
  try {
    const { from, to, date } = req.query;
    const { fromLocations, toLocations } = await Search.getLocations();
    
    const results = await Search.searchRoutes(from, to, date);

    res.render('user/search', {
      title: 'Kết quả tìm kiếm',
      fromLocations,
      toLocations,
      results,
      searchParams: { from, to, date }
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}; 