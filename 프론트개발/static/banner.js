$(document).ready(function() {
    let currentIndex = 0;
    const slideWidth = $('.imgslide li').width();
    const slideCount = $('.imgslide li').length;

    function goToSlide(index) {
        $('.imgslide').css('transform', `translateX(-${index * slideWidth}px)`);
        currentIndex = index;
        updateDots();
    }

    document.querySelectorAll('.dotbtn button').forEach((button, index) => {
        button.addEventListener('click', () => {
            /*document.querySelector('.imgslide').style.transform = `translateX(-${index * 1000}px)`;*/
            goToSlide(index);
        });
    });

    $('.prev').click(function() {
        const index = (currentIndex > 0) ? currentIndex - 1 : slideCount - 1;
        goToSlide(index);
    });
    $('.next').click(function() {
        const index = (currentIndex < slideCount - 1) ? currentIndex + 1 : 0;
        goToSlide(index);
    });

    function updateDots() {
        $('.dotbtn button').removeClass('active');
        $(`.dotbtn button:eq(${currentIndex})`).addClass('active');
    }

    goToSlide(0);
});