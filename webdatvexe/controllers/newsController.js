const News = require('../models/News');

exports.getAllNews = async (req, res) => {
    try {
        const news = await News.find()
            .sort({ createdAt: -1 });
        
        res.render('news', { 
            title: 'Tin tức & Khuyến mãi',
            news 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}; 