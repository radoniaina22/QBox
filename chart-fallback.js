if (typeof Chart === 'undefined') {
            // Secours si jsdelivr est inaccessible ; l'empreinte (SRI) garantit que le fichier n'a pas été modifié.
            document.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" integrity="sha384-dug+JxfBvklEQdJ4AYuBBAIScUz0bVN73xpy273gcAwHjb3qI0fXmuYNaNfdyYJG" crossorigin="anonymous"></script>');
        }
