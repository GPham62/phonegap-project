function populateDB(tx) {
    //create restaurants table
    tx.executeSql('DROP TABLE IF EXISTS restaurants');
    tx.executeSql('CREATE TABLE IF NOT EXISTS restaurants (res_id integer primary key not null, res_name text not null, type text, price integer, service text, cleanliness text, quality text, visited_time text, imageURI text)');
    //insert restaurant
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("res1", "type1", 10, "good", "good","excellent", "9PM 4/10/99", "img/restaurant1.png")');
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("res2", "type2", 20, "good", "good","excellent", "9PM 4/10/99", "img/restaurant1.png")');
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("res3", "type3", 30, "good", "good","excellent", "9PM 4/10/99", "img/restaurant1.png")');
    //create note table
    tx.executeSql('DROP TABLE IF EXISTS notes');
    tx.executeSql('CREATE TABLE IF NOT EXISTS notes (note_id integer primary key not null,content text not null,user_name text not null, res_id integer not null, foreign key (res_id) references restaurants (res_id) on update cascade on delete cascade)');
    //insert note
    tx.executeSql('insert into notes(content, user_name, res_id) values ("excellent food", "thao1", 1)')
    tx.executeSql('insert into notes(content, user_name, res_id) values ("good food", "thao2", 2)')
    tx.executeSql('insert into notes(content, user_name, res_id) values ("bad food", "thao3", 1)')
    tx.executeSql('insert into notes(content, user_name, res_id) values ("excellent food 2", "thao3", 2)')
}
function errorCB(tx, err) {
    alert("Error processing SQL: " + err);
}
function successCB() {

}
function loadAllRestaurants(tx) {
    tx.executeSql('select * from restaurants', [], function (t, rs) {
        console.log(rs)
        let restaurantNum = rs.rows.length;
        let resArray = []

        for (let i = 0; i < restaurantNum; i++) {
            let { res_id, res_name, service, quality, cleanliness, imageURI } = rs.rows.item(i);
            let rating = calculateRating({ service: toNumRating(service), cleanliness: toNumRating(cleanliness), quality: toNumRating(quality) })
            resArray.push(rs.rows.item(i))
            appendNewRes(res_id, res_name, rating, imageURI)
        }
        $("#ta-res-list").listview('refresh')

        $(".ta-slide-btn").on('click', function (e) {
            let res_id = $(this).attr('res-id')
            $.mobile.changePage('#info', { dataUrl: `/#info?parameter=${res_id}` });
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
function calculateRating({ service, cleanliness, quality }) {
    return Math.round((service + cleanliness + quality) / 3);
}
function takePhoto() {
    navigator.camera.getPicture(onCameraSuccess, onCameraError, {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
    })
}
function onCameraSuccess(imageURI) {
    console.log(imageURI)
    var img = document.getElementById('image');
    img.src = imageURI;
}
function onCameraError(message) {
    alert(message);
}
function appendNewNote(note_id, user_name, content) {
    $("#ta-note-list").append(
        `<label for="user1">${user_name}</label>` +
        `<textarea name="user1" id=${note_id} cols="20" rows="5" readonly>${content}</textarea>`
    )
}
function appendNewRes(res_id, res_name, rating, imageURI) {
    $("#ta-res-list").append(
        '<li data-theme="c">' +
        `<a class=ta-slide-btn data-transition="slide" res-id=${res_id}>` +
        `<img src=${imageURI}>` +
        `<h2>${res_name}</h2>` +
        `<p>Rating: <i class="fas fa-star">${rating}</i></p>` +
        '</a>' +
        `<a class=ta-slide-btn data-transition="slide" res-id=${res_id}></a>` +
        '</li>'
    )
}
function onSubmitNotes(db, user_name, note, res_id, note_id) {
    console.log(user_name, note, res_id)
    db.transaction(function (tx) {
        tx.executeSql(`insert into notes(content, user_name, res_id) values ("${note}", "${user_name}", "${res_id}")`)
        appendNewNote(null, user_name, note)
    }, errorCB, successCB)
}

$(document).ready(function () {
    //connect database
    var db = window.openDatabase("Database", "1.0", "Cordova Demo", 2000000);

    //setup database
    db.transaction(populateDB, errorCB, successCB);

    //load all restaurants
    db.transaction(loadAllRestaurants, errorCB, successCB)

    //get restaurant details
    $(document).on('pagebeforeshow', "#info", function (event, data) {
        let param = window.location.href.split("?")[1]
        let res_id = param.replace("parameter=", "");
        db.transaction(function (tx) {
            tx.executeSql(`select * from restaurants left join notes on restaurants.res_id = notes.res_id where restaurants.res_id=${res_id}`, [], function (t, rs) {
                let resNum = rs.rows.length
                $("#ta-note-list").empty();
                for (let i = 0; i < resNum; i++) {
                    if (i == 0) {
                        let { price, quality, res_name, service, cleanliness, type, visited_time, imageURI } = rs.rows.item(i)
                        let rating = calculateRating({ service: toNumRating(service), cleanliness: toNumRating(cleanliness), quality: toNumRating(quality) })
                        $("#ta-info-image").attr("src", imageURI)
                        $('.ta-info-res-name').text(res_name)
                        $('.ta-info-res-type').text(type)
                        $('.ta-info-res-price').text(price)
                        $('.ta-info-res-rating').text(rating)
                        $('.ta-info-res-visit').text(visited_time)
                        $('#hiddenResId').val(res_id)
                    }
                    let { note_id, content, user_name } = rs.rows.item(i)
                    if (note_id != null) {
                        appendNewNote(note_id, user_name, content)
                    }
                }
            })
        }, errorCB, successCB)
    });

    $("#takepicture").on('click', function(){
        takePhoto();
    })

    $("#ta-noteForm").submit(function (e) {
        e.preventDefault()
        let user_name = e.target.user_name.value
        let note = e.target.note.value
        let res_id = $("#hiddenResId").val()
        onSubmitNotes(db, user_name, note, res_id)
        $(':input', '#ta-noteForm')
            .not(':button, :submit, :reset, :hidden')
            .val('')
            .prop('checked', false)
            .prop('selected', false);
            $( "#ta-noteForm-close" ).trigger( "click" );
        // window.location.href = "#info"
    })

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
        },
        submitHandler: function (form) {
            var uname = $('#reviewForm input[name="uname"]').val();
            var rname = $('#reviewForm input[name="rname"]').val();
            var rtype = $('#reviewForm select[name="rtype"]').val();
            var rservice = $('#reviewForm select[name="rservice"]').val();
            var rcleanliness = $('#reviewForm select[name="rcleanliness"]').val();
            var rquality = $('#reviewForm select[name="rquality"]').val();
            var note = $('textarea#rnote').val();
            var time = $('#reviewForm input[name="time"]').val();
            var date = $('#reviewForm input[name="date"]').val();
            var price = parseInt($('#prices li.selected').last().data('value'), 10);
            var imageURI = $("#image").attr('src')
            
            let newResId;

            db.transaction(function (tx) {
                tx.executeSql(`insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("${rname}", "${rtype}", "${price}", "${rservice}", "${rcleanliness}","${rquality}", "${time + " " + date}", "${imageURI}")`, [], function (tx, rs) {
                    newResId = rs.insertId
                })
            }, errorCB, function () {
                db.transaction(function (tx) {
                    if(note != ''){
                        tx.executeSql(`insert into notes(content, user_name, res_id) values ("${note}", "${uname}", ${newResId})`)
                    }
                    let rating = calculateRating({ service: toNumRating(rservice), cleanliness: toNumRating(rcleanliness), quality: toNumRating(rquality) })
                    appendNewRes(newResId, rname, rating, imageURI)
                    $('#ta-res-list').listview("refresh")

                    $(".ta-slide-btn").on('click', function (e) {
                        let res_id = $(this).attr('res-id')
                        $.mobile.changePage('#info', { dataUrl: `/#info?parameter=${res_id}` });
                    })

                    $(':input', '#review')
                        .not(':button, :submit, :reset')
                        .val('')
                        .prop('checked', false)
                        .prop('selected', false);
                    $("#image").attr("src", "img/no-image.png")
                    
                    window.location.href = "#list"
                }, errorCB, successCB)
            })
            return false;
        }
    });

});


