$(document).ready(function () {

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

    // $("#reviewForm").on('submit', () =>{
    //     console.log('ye');
    // })

});


function responseMessage(msg) {
    $('.success-box').fadeIn(200);
    $('.success-box div.text-message').html("<span>" + msg + "</span>");
}