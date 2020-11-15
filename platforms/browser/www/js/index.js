
function populateDB(tx) {
    //create users table
    tx.executeSql('DROP TABLE IF EXISTS users');
    tx.executeSql('CREATE TABLE IF NOT EXISTS users (user_id integer primary key not null, name text not null)');
    //insert user
    tx.executeSql('INSERT INTO users (name) VALUES ("thao1")');
    tx.executeSql('INSERT INTO users (name) VALUES ("thao2")');
    tx.executeSql('INSERT INTO users (name) VALUES ("thao3")');
    //create restaurants table
    tx.executeSql('DROP TABLE IF EXISTS restaurants');
    tx.executeSql('CREATE TABLE IF NOT EXISTS restaurants (res_id integer primary key not null, name text not null, type text, price integer, service text, cleanliness text, quality text)');
    //insert restaurant
    tx.executeSql('insert into restaurants(name, type, price, service, cleanliness, quality) values ("res1", "type1", 10, "good", "good","excellent")');
    tx.executeSql('insert into restaurants(name, type, price, service, cleanliness, quality) values ("res2", "type2", 20, "good", "good","excellent")');
    tx.executeSql('insert into restaurants(name, type, price, service, cleanliness, quality) values ("res3", "type3", 30, "good", "good","excellent")');
    //create note table
    tx.executeSql('DROP TABLE IF EXISTS notes');
    tx.executeSql('CREATE TABLE IF NOT EXISTS notes (note_id integer primary key not null,content text not null,user_id integer not null, res_id integer not null, foreign key (user_id) references users (user_id) on update cascade on delete cascade, foreign key (res_id) references restaurants (res_id) on update cascade on delete cascade)');
    //insert note
    tx.executeSql('insert into notes(content, user_id, res_id) values ("excellent food", 1, 1)')
    tx.executeSql('insert into notes(content, user_id, res_id) values ("good food", 2, 1)')
    tx.executeSql('insert into notes(content, user_id, res_id) values ("bad food", 3, 1)')
}
function errorCB(tx, err) {
    alert("Error processing SQL: " + err);
}
function successCB() {
    // alert("success!");
}
var current_res_id;
function loadAllRestaurants(tx) {
    tx.executeSql('select * from restaurants', [], function (t, rs) {
        let restaurantNum = rs.rows.length;
        let resArray = []

        for (let i = 0; i < restaurantNum; i++) {
            let { res_id, name, service, quality, cleaniless } = rs.rows.item(i);
            let rating = calculateRating({ service: toNumRating(service), cleaniless: toNumRating(cleaniless), quality: toNumRating(quality) })
            resArray.push(rs.rows.item(i))

            $("#ta-res-list").append(
                '<li data-theme="c">' +
                `<a href="#info" data-transition="slide" res-id=${res_id}>` +
                '<img src="img/restaurant1.png">' +
                `<h2>${name}</h2>` +
                `<p>Rating: <i class="fas fa-star">${rating}</i></p>` +
                '</a>' +
                `<a class=ta-slide-btn data-transition="slide" res-id=${res_id} rating=${rating}></a>` +
                '</li>'
            )
            $("#ta-res-list").listview('refresh')
        }

        $(".ta-slide-btn").on('click', function (e) {
            let id = $(this).attr('res-id')
            current_res_id = id
            let rating = $(this).attr('rating')
            let resInfo = resArray.find(res => res.res_id == id)
            console.log(resInfo)
            $('.ta-info-res-name').text(resInfo.name)
            $('.ta-info-res-type').text(resInfo.type)
            $('.ta-info-res-price').text(resInfo.price)
            $('.ta-info-res-rating').text(rating)

            window.location.href = "/#info"

        })
    })
}

function toNumRating(stringRating) {
    if (stringRating == "Need to improve") {
        return 1;
    } else if (stringRating == "OKAY") {
        return 2;
    } else if (stringRating == "Good") {
        return 3;
    } else {
        return 4;
    }
}
function calculateRating({ service, cleaniless, quality }) {
    return Math.round((service + cleaniless + quality) / 3);
}
function takePhoto() {
    navigator.camera.getPicture(onCameraSuccess, onCameraError, {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
    })
}
function onCameraSuccess(imageURI) {
    var img = document.getElementById('image');
    img.src = imageURI;
}
function onCameraError(message) {
    alert(message);
}
$(document).ready(function () {
    //connect database
    var db = window.openDatabase("Database", "1.0", "Cordova Demo", 20000000);

    //setup database
    db.transaction(populateDB, errorCB, successCB);
    //load all restaurants
    db.transaction(loadAllRestaurants, errorCB, function (tx) {
        db.transaction(function (tx) {
            tx.executeSql('select * from notes where res_id = ?', [], function (tx, rs) {
                //đây này where vào rồi vẫn select hết đhs
                
                // let noteNum = rs.rows.length;
                // for(let i = 0; i < noteNum; i++){
                //     let res = rs.rows.item(i)
                //     if(res.id == current_res_id){
                //         console.log(res)
                //         break;
                //     }
                // }
                console.log(rs)
            })
        })
    });

    $("#takepicture").on('click', () => {
        takePhoto();
    })
<<<<<<< HEAD
    
=======

>>>>>>> fbc2a51e74881611104d7614931db3888475f89e
    //star rating jquery
    /* 1. Visualizing things on Hover - See next part for action on click */
    $('#prices li').on('mouseover', function () {
        var onPrice = parseInt($(this).data('value'), 10); // The star currently mouse on

        // Now highlight all the stars that's not after the current hovered star
        $(this).parent().children('li.star').each(function (e) {
            if (e < onPrice) {
                $(this).addClass('hover');
            }
            else {
                $(this).removeClass('hover');
            }
        });

    }).on('mouseout', function () {
        $(this).parent().children('li.star').each(function (e) {
            $(this).removeClass('hover');
        });
    });


    /* 2. Action to perform on click */
    $('#prices li').on('click', function () {
        var onPrice = parseInt($(this).data('value'), 10); // The star currently selected
        var prices = $(this).parent().children('li.star');

        for (i = 0; i < prices.length; i++) {
            $(prices[i]).removeClass('selected');
        }

        for (i = 0; i < onPrice; i++) {
            $(prices[i]).addClass('selected');
        }

        // JUST RESPONSE (Not needed)
        var ratingValue = parseInt($('#prices li.selected').last().data('value'), 10);

        $("#hiddenPrice").attr('value', ratingValue);
        // var msg = "";
        // if (ratingValue > 1) {
        //     msg = "Thanks! You rated this " + ratingValue + " stars.";
        // }
        // else {
        //     msg = "We will improve ourselves. You rated this " + ratingValue + " stars.";
        // }
        // responseMessage(msg);

    });

    //validator
    $.validator.addMethod("notnull", function (value, element) {
        var val = element.attributes["value"]["value"];
        return this.optional(element) || val > 0;
    }, "Price is required!");

    $("#reviewForm").validate({
        ignore: [],
        rules:
        {
            uname: {
                required: true
            },
            rname: {
                required: true
            },
            time: {
                required: true
            },
            date: {
                required: true
            },
            hiddenPrice: {
                notnull: true
            },
        },
        messages: {
            uname: {
                required: "Reviewer name is required!",
            },
            rname: {
                required: "Restaurant name is required!",
            },
            time: {
                required: "Time is required!",
            },
            date: {
                required: "Date is required!",
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (form) {
            $(':mobile-pagecontainer').pagecontainer('change', '#info', {
                reload: false
            });
            return false;
        }
        // submitHandler: function (form) {
        //     var uname = $('#reviewForm input[name="uname"]').val();
        //     var rname = $('#reviewForm input[name="rname"]').val();
        //     var rtype = $('#reviewForm select[name="rtype"]').val();
        //     var time = $('#reviewForm input[name="time"]').val();
        //     var date = $('#reviewForm input[name="date"]').val();
        //     var price = parseInt($('#prices li.selected').last().data('value'), 10);
        //     console.log(price);
        //     return false;
        // }
    });

});


