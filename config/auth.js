exports.redirectLogin = (req, res, next) => {
    if (!req.session.userdetails) {
        res.redirect('/users/login')

    }
    else {
        next()
    }
}


exports.redirectHome = (req, res, next) => {
    if (req.session.userdetails) {
        if (req.session.usertype != 'helper')
            res.redirect('/dashboard');
        else
            res.redirect('/dashboard2');
    }


    else {
        next()
    }
}