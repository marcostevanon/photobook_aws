// const URL = "http://localhost:5671";
// const URL = "http://192.168.1.113:5671";
const URL = "http://ec2-63-33-232-170.eu-west-1.compute.amazonaws.com:5671";

async function fetch_gallery() {
    if (!sessionStorage.getItem('token')) return goto_login();

    $('#login').hide();

    // fetch all images
    // for each image gets [id, url, user, n_votes, avg_votes, vote]
    // vote can be integer or null. If null, current user didn't vote the image yet
    try {
        fetch(URL + '/gallery', {
            headers: { 'x-access-token': sessionStorage.getItem('token') }
        }).then(res => res.json())
            .then(res => {

                // each image is append to the list using bootstrap card
                $('#images-list').html('');
                res.forEach(img => {
                    $('#images-list').append(`
                        <div class="card mt-2 card-dim">
                            <img class="card-img-top" src="${img.url}" alt="">
                            <div class="card-body pt-2">
                                <div class="card-title">Uploaded by ${img.user}</div>

                                <div class="container-fluid">
                                    <div class="row" id="vote-form-${img.id}">
                                        <div class="col-8 p-0">
                                            <select id="vote-select-${img.id}" class="custom-select">
                                                <option selected>Vote!</option>
                                                <option value="1">1</option>
                                                <option value="2">2</option>
                                                <option value="3">3</option>
                                                <option value="4">4</option>
                                                <option value="5">5</option>
                                            </select>
                                        </div>
                                        <div class="col-4 pr-0">
                                            <button class="btn btn-outline-primary btn-block" onclick="vote(${img.id})">Send</button>
                                        </div>
                                        <div id="vote-msg-${img.id}" class="col-12 pr-0 alert alert-danger form-group mt-3 mb-1 p-0 text-center" style="display:none">
                                            Seleziona un voto
                                        </div>
                                    </div>

                                    <div class="col-12 p-0 text-center" id="vote-rating-${img.id}" style="display: none">
                                        <div id="vote-avg-${img.id}" style="display: inline-block">${img.avg_votes}</div>&nbsp;
                                        <div id="vote-star-${img.id}" style="display: inline-block"></div>
                                        &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                                        <div id="vote-num-${img.id}" style="display: inline-block">${img.n_votes}</div> votes
                                    </div>
                                </div>

                            </div>
                        </div>`);

                    if (img.vote) {
                        for (var i = 0; i < img.avg_votes; i++)
                            $('#vote-star-' + img.id).append('<i class="fas fa-star"></i>');
                        for (var i = 0; i < 5 - img.avg_votes; i++)
                            $('#vote-star-' + img.id).append('<i class="far fa-star"></i>');

                        $('#vote-form-' + img.id).hide();
                        $('#vote-rating-' + img.id).show();
                    }
                });

                $('#main-loader').hide();
                $('#gallery').show();
            })
            .catch(err => {
                console.log(err);
                return goto_login()
            });


        fetch_ranking();

    } catch (e) { goto_login() }
}

function fetch_ranking() {
    fetch(URL + '/gallery/rating', {
        headers: { 'x-access-token': sessionStorage.getItem('token') }
    }).then(res => res.json())
        .then(res => {
            $('#rating-list').html('');
            res.forEach(img => {
                $('#rating-list').append(`
                    <div class="card mt-2 card-dim">
                        <img class="card-img-top" src="${img.url}" alt="">
                        <div class="card-body pt-2">
                            <div class="card-title">Uploaded by ${img.user}</div>

                            <div class="container-fluid">
                                <div class="col-12 p-0 text-center" id="rank-vote-rating-${img.id}">
                                    <div id="rank-vote-avg-${img.id}" style="display: inline-block">${img.avg_votes}</div>&nbsp;
                                    <div id="rank-vote-star-${img.id}" style="display: inline-block"></div>
                                    &nbsp;&nbsp;&bull;&nbsp;&nbsp;
                                    <div id="rank-vote-num-${img.id}" style="display: inline-block">${img.n_votes}</div> votes
                                </div>
                            </div>
                        </div>
                    </div>`);

                for (var i = 0; i < img.avg_votes; i++)
                    $('#rank-vote-star-' + img.id).append('<i class="fas fa-star"></i>');
                for (var i = 0; i < 5 - img.avg_votes; i++)
                    $('#rank-vote-star-' + img.id).append('<i class="far fa-star"></i>');
            });
        })
        .catch(err => {
            console.log(err);
            return goto_login()
        });
}

function setNavUsername() {
    if (sessionStorage.getItem('user'))
        $('#username-nav').html('Hi, ' + JSON.parse(sessionStorage.getItem('user')).username + '&nbsp;&nbsp;&bull;&nbsp;&nbsp;')
}

function goto_login() {
    $('#main-loader').hide();
    $('#gallery').hide();
    $('#login').show();
}

function vote(id_img) {
    var vote = parseInt($('#vote-select-' + id_img).val());
    if (!vote) $('#vote-msg-' + id_img).show();
    else {
        $('#vote-msg-' + id_img).hide();

        $('#vote-form-' + id_img).hide();
        $('#vote-rating-' + id_img).show();

        var nvotes = parseInt($('#vote-num-' + id_img).text()) + 1;
        $('#vote-num-' + id_img).html(nvotes);

        var avg = (parseInt($('#vote-avg-' + id_img).text()) + vote) / nvotes;
        $('#vote-avg-' + id_img).html(avg);

        for (var i = 0; i < avg; i++)
            $('#vote-star-' + id_img).append('<i class="fas fa-star"></i>');
        for (var i = 0; i < 5 - avg; i++)
            $('#vote-star-' + id_img).append('<i class="far fa-star"></i>');

        fetch(URL + '/vote', {
            method: 'POST',
            body: JSON.stringify({
                image_id: id_img,
                user_id: JSON.parse(sessionStorage.getItem('user')).id,
                vote_value: vote
            }),
            headers: { 'x-access-token': sessionStorage.getItem('token'), 'Content-Type': 'application/json' }
        })
            .then(res => {
                console.log(res);
                fetch_ranking()
            })
            .catch(err => { console.log(err); })
    }
}

function logout() {
    sessionStorage.clear();
    $('#login').show();
    $('#gallery').hide()
}

$('#login-form').on('submit', e => {
    e.preventDefault();

    $('#login-loader').show();
    $('#login-label').hide();
    $('#login-alert').hide();

    fetch(URL + '/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            username: $('#login-username').val(),
            password: $('#login-password').val()
        }),
        headers: { 'Content-Type': 'application/json' },
    }).then(res => res.json())
        .then(res => {
            sessionStorage.setItem('token', res.token)
            sessionStorage.setItem('user', JSON.stringify(res.user))
            $('#login-loader').hide();
            $('#login-label').show();
            $('#login-alert').hide();

            $('#main-loader').show();
            fetch_gallery();
            setNavUsername();
            $('#upload-message').html('');
        })
        .catch(err => {
            console.log(err);
            $('#login-loader').hide();
            $('#login-label').show();
            $('#login-alert').html(err);
            $('#login-alert').show();
        })
});

$('#upload-form').on('submit', e => {
    e.preventDefault();

    var file = e.target[0].files[0];
    var data = new FormData();
    data.append('image', file);
    data.append('originalname', file.name);

    $('#upload-form').hide();
    $('#upload-spinner').show();
    $('#upload-message').html('');

    fetch(URL + '/upload',
        { method: 'POST', body: data, contentType: 'multipart/form-data', headers: { 'x-access-token': sessionStorage.getItem('token') } })
        .then(res => {
            $('#upload-form').show();
            $('#upload-spinner').hide();

            if (!res.ok)
                $('#upload-message').html(`<code style="color:red;">An error occurred! - ${res.status}</code>`);
            else {
                $('#upload-form-input').val('');
                $('#upload-message').html('<code style="color:green;">File uploaded successfully!</code>');

                setTimeout(() => { fetch_gallery() }, 500);
            }
        })
        .catch(err => {
            console.log(err);
            $('#upload-message').html(`<code style="color:red;">An error occurred!</code>`);
        })
});

fetch_gallery()
setNavUsername();