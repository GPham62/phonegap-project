function populateDB(tx) {
    //create restaurants table
    tx.executeSql('DROP TABLE IF EXISTS restaurants');
    tx.executeSql('CREATE TABLE IF NOT EXISTS restaurants (res_id integer primary key not null, res_name text not null, type text, price integer, service text, cleanliness text, quality text, visited_time text, imageURI text)');
    //insert restaurant
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("res1", "type1", 1, "okay", "okay","okay", "9PM 4/10/99", "img/restaurant1.png")');
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("res2", "type2", 2, "good", "good","excellent", "9PM 4/10/99", "img/restaurant1.png")');
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("res3", "type3", 3, "good", "good","excellent", "9PM 4/10/99", "img/restaurant1.png")');
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
//sửa tên hàm, tên biến
function loadAllRestaurants(tx) {
    tx.executeSql('select * from restaurants', [], function (t, rs) {
        let restaurantNum = rs.rows.length;
        let resArray = []

        //đổi forEach
        for (let i = 0; i < restaurantNum; i++) {
            let { res_id, res_name, service, quality, cleanliness, imageURI } = rs.rows.item(i);
            let rating = calculateRating({ service: toNumRating(service), cleanliness: toNumRating(cleanliness), quality: toNumRating(quality) })
            resArray.push(rs.rows.item(i))

            //không gọi hàm tự viết ra
            appendNewRes(res_id, res_name, imageURI)
        }

        //đổi restaurantList
        $("#restaurantList").listview('refresh')

        //đổi showResDetails
        $(".showResDetails").on('click', function (e) {
            let res_id = $(this).attr('res-id')
            //đổi resId thành res_id
            $.mobile.changePage('#resDetails', { dataUrl: `/#resDetails?resId=${res_id}` });
        })
    })
}
//sửa hết: tên biến, tên hàm, switch
function toNumRating(stringRating) {
    if (stringRating == "improve") {
        return 1;
    } else if (stringRating == "okay") {
        return 2;
    } else if (stringRating == "good") {
        return 3;
    } else {
        return 4;
    }
}
//sửa hết: tên biến, tên hàm, truyền param, viết dài ra, đổi round thành cái khác 
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
function appendNewRes(res_id, res_name, imageURI) {
    $("#restaurantList").append(
        '<li data-theme="c">' +
        `<a class="showResDetails" data-transition="slide" res-id=${res_id}>` +
        `<img src=${imageURI}>` +
        `<h2>${res_name}</h2>` +
        '</a>' +
        '</li>'
    )
}
function deleteRes(res_id) {
    var a_resId = document.querySelector(`a[res-id="${res_id}"]`);
    a_resId.closest('li').remove();
}
function onSubmitNotes(db, user_name, note, res_id, note_id) {
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

    //render restaurant details
    $(document).on('pagebeforeshow', "#resDetails", function (event, data) {
        let param = window.location.href.split("?")[1]
        let res_id = param.replace("resId=", "");
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
                        $('.ta-info-res-price').text(`${price}/5`)
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

    $("#takepicture").on('click', function () {
        takePhoto();
    })

    $("#ta-noteForm").validate({
        ignore: [],
        rules:
        {
            user_name: {
                required: true
            },
            note: {
                required: true
            }
        },
        messages: {
            user_name: {
                required: "Required!",
            },
            note: {
                required: "Required!",
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (form) {
            let user_name = $('#ta-noteForm input[name="user_name"]').val();
            let note = $('#ta-noteForm textarea[name="note"]').val();
            let res_id = $("#hiddenResId").val()
            onSubmitNotes(db, user_name, note, res_id)
            $(':input', '#ta-noteForm')
                .not(':button, :submit, :reset, :hidden')
                .val('')
                .prop('checked', false)
                .prop('selected', false);
            $("#ta-noteForm-close").trigger("click");
            return false;
        }
    });

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
        var ratingValue = parseInt($('#prices li.selected').last().data('value'), 10);

        $("#hiddenPrice").attr('value', ratingValue);
    });

    //validator
    $.validator.addMethod("notnull", function (value, element) {
        var val = element.attributes["value"]["value"];
        return this.optional(element) || val > 0;
    }, "Price is required!");


    $('#edit-prices li').on('mouseover', function () {
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

    $('#edit-prices li').on('click', function () {
        var onPrice = parseInt($(this).data('value'), 10);
        var prices = $(this).parent().children('li.star');

        for (i = 0; i < prices.length; i++) {
            $(prices[i]).removeClass('selected');
        }

        for (i = 0; i < onPrice; i++) {
            $(prices[i]).addClass('selected');
        }
        var ratingValue = parseInt($('#edit-prices li.selected').last().data('value'), 10);

        $("#editHiddenPrice").attr('value', ratingValue);
    });

    $("#delResBtn").on("click", function () {
        let res_id = $("#hiddenResId").val()
        db.transaction(function (tx) {
            tx.executeSql(`delete from restaurants where restaurants.res_id=${res_id}`)
            tx.executeSql(`delete from notes where notes.res_id=${res_id}`)
            deleteRes(res_id);
        }, errorCB, successCB)
    })

    //sửa toàn bộ
    $("#reviewForm").validate({
        ignore: [],
        rules:
        {
            reviewerName: {
                required: true
            },
            restaurantName: {
                required: true
            },
            visitTime: {
                required: true
            },
            visitDate: {
                required: true
            },
            hiddenPrice: {
                notnull: true
            },
        },
        messages: {
            reviewerName: {
                required: "Your name required!",
            },
            restaurantName: {
                required: "Restaurant name required!",
            },
            visitTime: {
                required: "Visit time required!",
            },
            visitDate: {
                required: "Visit date required!",
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (form) {
            var insertedResId;
            var reviewerName = $('#reviewForm input[name="reviewerName"]').val();
            var restaurantName = $('#reviewForm input[name="restaurantName"]').val();
            var restaurantType = $('#reviewForm select[name="restaurantType"]').val();
            var restaurantService = $('#reviewForm select[name="restaurantService"]').val();
            var restaurantClean = $('#reviewForm select[name="restaurantClean"]').val();
            var foodQuality = $('#reviewForm select[name="foodQuality"]').val();
            var visitTime = $('#reviewForm input[name="visitTime"]').val();
            var visitDate = $('#reviewForm input[name="visitDate"]').val();
            var price = parseInt($('#prices li.selected').last().data('value'), 10);
            var note = $('textarea#rnote').val();
            var imageURI = $("#image").attr('src')

            db.transaction(function (tx) {
                tx.executeSql(`insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("${restaurantName}", "${restaurantType}", "${price}", "${restaurantService}", "${restaurantClean}","${foodQuality}", "${visitTime + " " + visitDate}", "${imageURI}")`, [], function (tx, rs) {
                    insertedResId = rs.insertId
                })
            }, errorCB, function () {
                db.transaction(function (tx) {
                    //if note exists, save it in the note table
                    if (note != "") {
                        tx.executeSql(`insert into notes(content, user_name, res_id) values ("${note}", "${reviewerName}", ${insertedResId})`)
                    }

                    //append new restaurant in the restaurant list
                    $("#restaurantList").append(
                        '<li data-theme="c">' +
                        `<a class="showResDetails" data-transition="slide" res-id=${insertedResId}>` +
                        `<img src=${imageURI}>` +
                        `<h2>${restaurantName}</h2>` +
                        '</a>' +
                        '</li>'
                    )
                    //refresh the restaurant list
                    $('#restaurantList').listview("refresh")

                    //add event to show detail button 
                    $(".showResDetails").on('click', function (e) {
                        let resId = $(this).attr('res-id')
                        $.mobile.changePage('#resDetails', { dataUrl: `/#resDetails?resId=${resId}` });
                    })

                    //clear all inputs and image
                    $('#reviewForm input[name="reviewerName"]').val("");
                    $('#reviewForm input[name="restaurantName"]').val("");
                    $('#reviewForm input[name="visitTime"]').val("");
                    $('#reviewForm input[name="visitDate"]').val("");
                    $('textarea#rnote').val("");
                    $("#image").attr("src", "img/default-image.png")

                    window.location.href = "#list"
                }, errorCB, successCB)
            })
            return false;
        }
    });

    $("#ta-editForm").validate({
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
            editHiddenPrice: {
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
            var rname = $('#ta-editForm input[name="rname"]').val();
            var rtype = $('#ta-editForm select[name="rtype"]').val();
            var rservice = $('#ta-editForm select[name="rservice"]').val();
            var rcleanliness = $('#ta-editForm select[name="rcleanliness"]').val();
            var rquality = $('#ta-editForm select[name="rquality"]').val();
            var time = $('#ta-editForm input[name="time"]').val();
            var date = $('#ta-editForm input[name="date"]').val();
            var price = parseInt($('#edit-prices li.selected').last().data('value'), 10);
            var res_id = $('#hiddenResId').val()

            db.transaction(function (tx) {
                tx.executeSql(`update restaurants set res_name="${rname}", type="${rtype}", price="${price}", service="${rservice}", cleanliness="${rcleanliness}", quality="${rquality}", visited_time="${time + " " + date}" where res_id=${res_id}`, [], function (tx, rs) {
                    $(':input', '#ta-editForm')
                        .not(':button, :submit, :reset, :hidden')
                        .val('')
                        .prop('checked', false)
                        .prop('selected', false);
                    $("#ta-editForm-close").trigger("click");

                    $('.ta-info-res-name').text(rname)
                    $('.ta-info-res-type').text(rtype)
                    $('.ta-info-res-price').text(`${price}/5`)
                    $('.ta-info-res-rating').text(calculateRating({ service: toNumRating(rservice), cleanliness: toNumRating(rcleanliness), quality: toNumRating(rquality) }))
                    $('.ta-info-res-visit').text(`${time + " " + date}`)

                    $("#restaurantList").empty();
                    db.transaction(loadAllRestaurants, errorCB, successCB)
                })
            }, errorCB, successCB)
            return false;
        }
    });

});


