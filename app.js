const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const catchAsync = require('./utils/catchAsync');
const joi = require('joi');
const { campgroundSchema } = require('./schemas.js');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const methodOverride = require('method-override');

mongoose.connect('mongodb://localhost:27017/yelp-camp')

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error: "));
db.once("open", () => {
    console.log("Connection is open")
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const validatCampround = (req, res, next) => {  
    const { error } = campgroundSchema.validate(req.body);
    if(error){
        const msg = error.details.map(el => el.message).join('');
        throw new ExpressError(result.error.details, 400)
    }else{
        next();
    }
}

app.get('/', (req, res) => {
    res.send('Hello, world');
});

app.get('/campground', catchAsync(async (req, res) => {
    const campground = await Campground.find({});
    res.render('campgrounds/index', { campground });
}));

app.get('/campground/new', (req, res) => {
    res.render('campgrounds/new');
});

app.post('/campground', validatCampround, catchAsync(async (req, res, next) => {
    // if(!req.body.campground) throw new ExpressError('Invalid campground', 400);
    const newProduct = new Campground(req.body.campground);
    await newProduct.save();
    res.redirect(`campground/${newProduct._id}`);
}));

app.get('/campground/:id', catchAsync(async (req, res) => {
    const id = req.params.id;
    const campground = await Campground.findById(id);
    res.render('campgrounds/show', { campground });
}));

app.get('/campground/:id/edit', catchAsync(async (req, res) => {
    const id = req.params.id;
    const campground = await Campground.findById(id);
    res.render('campgrounds/edit', { campground });
}));

app.put('/campground/:id', validatCampround, catchAsync(async (req, res) => {
    const id = req.params.id;
    console.log(req.body);
    const campground = await Campground.findByIdAndUpdate(id, req.body.campground, { runValidators: true });
    res.redirect(`/campground/${campground._id}`);
}));

app.delete('/campground/:id', catchAsync(async (req, res) => {
    const id = req.params.id;
    await Campground.findByIdAndDelete(id);
    res.redirect('/campground');
}));

app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = "Oh No, Something went wrong!";
    res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
    console.log('listening on port 3000');
});