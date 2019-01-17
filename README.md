### `This app is created for EDUCATIONAL PURPOSE ONLY, the data entered may not be protected and it is recommended not to use real or sensitive data`
<br>

# PHOTO-CONTEST SERVERLESS
<br>

## COME UTILIZZARE
Collegatevi al seguente link:
[photocontest.marcostevanon.ovh](http://photocontest.marcostevanon.ovh)<br>
*per utilizzare l'app è necessario creare un utente*

---
<br>

## TECNOLOGIE UTILIZZATE
- AWS
    - S3
    - RDS
    - EC2
    - CLOUDFRONT
    - LAMBDA
- BACKEND
    - NODE.JS
    - RABBITMQ
    - REDIS
    - ELASTICHSEARCH
- FRONTEND
    - MITHRIL.JS
    - CONSTRUCT-UI
---
<br>



## FUNZIONI

### REGISTER NEW USER
> `REQUEST` => API => RDS

Il client invia una richiesta API ad un server REST, inviando:
- email
- username
- password

Dopo che è stato generato l'hash della password viene aggiunto ad `RDS` il nuovo utente<br>
NB: Un nuovo utente può visualizzare le foto caricate da altri utenti e votarle

---

### LOGIN
> `REQUEST` => API *(jwt)* => RDS

Il client invia una richiesta API ad un server REST, inviando:
- username
- password (cifrata)

Il server REST controlla la validità dei dati inseriti e restituisce un token di accesso in caso i dati inseriti siano corrispondenti ad utente registrato<br>
Il token contiene i seguenti valori:
- user id
- username

---

### SHOW GALLERY
> `REQUEST` => API => REDIS *(get)*

Il client invia una richiesta API ad un server REST<br>
Viene restituita la lista di pagine della galleria, la lista di foto per la pagina selezionata e relativi dati (da redis)
- lista pagine
- lista foto per pagina

---

### SHOW RATING
> `REQUEST` => API => REDIS *(get)*

Il client invia una richiesta API ad un server REST<br>
Viene restituita la classifica delle 5 foto più votate (da redis)
- lista 5 foto più votate

---

### UPLOAD PHOTO
> `CLIENT REQUEST` => API => S3 => CLOUDFRONT => RDS<br>
> `DETACHED MODE` &nbsp;&nbsp; => API => RABBITMQ => EC2 => CLOUDFRONT => RDS *(update)* => REDIS *(set)*

Il client invia una richiesta API ad un server REST, inviando:
- foto
- utente *(attraverso il token)*

**FASE 1**<br>
Il server REST carica la foto originale su un bucket `S3`<br>
In seguito genera il link di `CLOUDFRONT` per accedere all'immagine attraverso CDN amazon<br>
Infine aggiunge a `RDS` una nuova entry con l'url della nuova immagine e l'utente che l'ha caricata

**FASE 2** *(in background)*<br>
Il server REST aggiunge alla coda di RabbitMQ i dati appena inseriti<br>
Attraverso un consumer in attesa su un'istanza `EC2`, le immagini caricate vengono elaborate:
- riduzione dell'immagine in proporzione con lunghezza massima lato di 1000px
- generazione qrcode con l'url (`CLOUDFRONT`) dell'immagine ridotta
- aggiornamento dell'entry di `RDS` con url immagine ridotta e url immagine qrcode
- invio notifica di caricamento riuscito al client

---

### DETELE PHOTO
> `REQUEST` => API => S3 => RDS

Il client invia una richiesta API ad un server REST<br>
In modo atomico vengono eseguite le seguenti operazioni:
- rimossa la foto originale da `S3`
- rimossa la foto modificate da `S3`
- rimossa la entry da `RDS`
   
---

### VOTE PHOTO
> `REQUEST` => API => RDS => REDIS *(set)*

Il client invia una richiesta API ad un server REST, inviando:
- id foto
- voto inserito

In modo atomico vengono eseguite le seguenti operazioni:
- aggiunta un'entry nella tabella voti relativa al voto appena inviato
- calcolato la nuova media ed aggiornata la entry di RDS
- calcolato la nuova media ed aggiornata la entry di redis
- aggiornata la lista delle pagine della galleria
 
---
<br>

## REDIS

### GESTIONE CLASSIFICA
Viene gestita una lista ordinata con `REDIS`<br>
Ogni 24 ore e ad ogni voto inserito correttamente su `RDS`, viene eseguito il calcolo della rilevanza per ogni immagine:<br>
Sono presi in considerazione i seguenti valori:
- Data di caricamento dell'immagine (più l'immagine è recente, più è rilveante)
- Voto medio dell'immagine (più il voto è altro più l'immagine è rilevante)

La lista ordinata di `REDIS` è strutturata nel modo seguente:
- score: rilevanza della foto calcolata
- value: dati utili alla visualizzazione dell'interfaccia

| score | value |
|:---:|:---:|
| 25.6 | { image.jpg, username } |
| 16.5 | { image.jpg, username } |
| 12.8 | { image.jpg, username } |
| 3.0 | { image.jpg, username } |
| 1.7 | { image.jpg, username } |
*esempio di visualizazzione in ordine inverso*

---
<br>

### GESTIONE PAGINATORE GALLERIA
Viene gestita una lista ordinata con `REDIS`<br>
Ad ogni foto inserita ed elaborata correttamente, viene aggiornata la lista che contiene le pagine della galleria:<br>

La lista ordinata di `REDIS` è strutturata nel modo seguente:
- score: numero della pagina
- value: array di dati in formato json della lista di foto corrispondenti alla pagina

*utilizzare questa lista permette una navigazione più veloce fra le pagine della galleria ed evita di eseguire ripetutamente le stesse query*

| score | value |
|:---:|:---:|
| 1 | [ { url: ..., userid: ..., username: ..., average_vote: ...  }, {...} ] |
| 2 | [ { url: ..., userid: ..., username: ..., average_vote: ...  }, {...} ] |
| 3 | [ { url: ..., userid: ..., username: ..., average_vote: ...  }, {...} ] |
| 4 | [ { url: ..., userid: ..., username: ..., average_vote: ...  }, {...} ] |
| 5 | [ { url: ..., userid: ..., username: ..., average_vote: ...  }, {...} ] |
*esempio di visualizazzione*

---
<br>

## RABBITMQ

### ELABORAZIONE DELLE IMMAGINI CARICATE
Quando un'immagine è caricata correttamente su `S3` e aggiunta a `RDS` viene aggiunta un'operazione alla coda di `RabbitMQ`<br>
//TODO//

---
<br>

## FRONTEND

### LOGIN
La pagina login contiene una semplice form per l'accesso all'app con token jwt

### REGISTRATION
La pagina registration permette di creare un nuovo utente per accedere all'app

### GALLERY
La pagina Gallery contiene due elementi principali
- Lista con un numero limitato di foto per consentire la migliore esperienza utente
- Un paginatore per navigare attraverso le foto caricate
- Per ogni immagine è visualizzato:
    - l'utente che l'ha caricate
    - la data e l'ora di caricamento
    - una form per votare in modo semplice la foto con un voto che va da 1 a 5 (è ammesso solo un voto per utente)

### RANKING
La pagina Ranking contienele prime 5 foto in ordine di rilevanza

### UPLOAD FORM 
Contiene una form per il caricamento di nuove immagini da parte dell'utente loggato

---

## SCREENSHOOT, SHOWCASES AND FLOW SCHEMA
---

`by Marco Stevanon`