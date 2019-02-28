## *This app is created for **EDUCATIONAL PURPOSE ONLY**, the data entered may not be protected and it is recommended not to use real or sensitive data*

## *Questa app è creata a **SOLO SCOPO EDUCATIVO**, i dati inseriti potrebbero non essere protetti e si raccomanda di non utilizzare dati reali o sensibili*
<br />

# ITS PHOTO CONTEST - Backend
Vedi **[frontend](https://github.com/marcostevanon/ITS_PhotoContest-Client)<br>**

## TECNOLOGIE UTILIZZATE
- AWS S3 (storage + web server)
- AWS RDS (PostgreSQL)
- AWS CLOUDFRONT
- AWS LAMBDA
- AWS EC2 (API):
	- NODE.JS & PM2
	- EXPRESS.JS
	- REDIS	
	- RABBITMQ
	- ELASTICH SEARCH
---
<br>

## FUNZIONI

### REGISTRAZIONE NUOVO UTENTE
> `REQUEST` => API => RDS

Il client invia una richiesta al server REST, inviando:
```
{
    "firstname": "Francesco",
    "lastname": "Biamchi",
    "username": "francescob",
    "email": "francesco.b@gmail.com",
    "password": "password"
}
```
Dopo che è stato generato l'hash della password viene aggiunto ad `RDS` il nuovo utente<br>
NB: Un nuovo utente può caricare delle foto, visualizzare le foto caricate da altri utenti e votarle

---

### LOGIN
> `REQUEST` => API *(jwt)* => RDS

Il client invia una richiesta al server REST, inviando:
```
{
    "username": "pippo",
    "password": "ugo"
}
```

Il server REST controlla la validità dei dati inseriti e restituisce un messaggio contenente il token di accesso, solo in caso i dati inseriti siano corrispondenti ad un utente registrato<br>

```
{
  "message": "Authorized",
  "status": 200,
  "token": "xxxxxxxxx",
  "expiresIn": 14400,
  "user": {
    "id": 345,
    "username": "mario",
    "avatar": "https://example.com/images/imagename.jpg"
  }
}
```

---

### GALLERIA
> `REQUEST` => API => REDIS *(get)*

Viene restituita la lista di pagine della galleria, la lista di foto per la pagina selezionata e relativi dati (da redis)
- lista pagine
- lista foto per pagina

---

### CLASSIFICA
> `REQUEST` => API => REDIS *(get)*

Viene restituita la classifica delle 10 foto più votate (da redis)
- lista 10 foto più votate

---

### CARICAMENTO FOTO
> `CLIENT REQUEST` => API => S3 => CLOUDFRONT => RDS<br>
> `DETACHED MODE` => API => RABBITMQ => EC2 => CLOUDFRONT => RDS *(update)* => REDIS *(set)*  => ELASTIC SEARCH *(update)*

Il client invia una richiesta al server REST, inviando:
- foto
- utente *(attraverso il token)*

**FASE 1**<br>
Il server REST carica la foto originale su un bucket `S3`<br>
In seguito genera il link di `CLOUDFRONT` per accedere all'immagine attraverso CDN amazon<br>
Infine aggiunge a `RDS` una nuova entry con l'url della nuova immagine e l'utente che l'ha caricata

**FASE 2** *(in background)*<br>
Il server REST aggiunge alla coda di RabbitMQ la foto appena inserita<br>
Attraverso un consumer in attesa su un'istanza `EC2`, le immagini caricate vengono elaborate:
- riduzione dell'immagine con dimensione massima di 1000px per lato (quadrata)
- aggiornamento dell'entry di `RDS` con url immagine ridotta e url immagine qrcode
- invio notifica di caricamento riuscito al client
- generazione qrcode con l'url (`CLOUDFRONT`) dell'immagine ridotta

---

### CANCELLAZIONE PHOTO
> `REQUEST` => API => S3 => RDS

In modo atomico vengono eseguite le seguenti operazioni:
- rimossa la foto originale da `S3`
- rimossa la foto modificate da `S3`
- rimossa la entry da `RDS`
   
---

### VOTO FOTO
> `REQUEST` => API => RDS => REDIS *(set)*

Il client invia una richiesta al server REST, inviando:
- id foto
- voto inserito

In modo atomico vengono eseguite le seguenti operazioni:
- aggiunta un'entry nella tabella voti relativa al voto appena inviato
- calcolato la nuova media ed aggiornata la entry di RDS
- calcolato la nuova media ed aggiornata la entry di redis
- aggiornata la lista delle pagine della galleria di redis
 
---
<br>

## REDIS

### GESTIONE CLASSIFICA
Viene gestita una lista ordinata con `REDIS`<br>
Ad ogni voto inserito correttamente su `RDS`, viene eseguito il calcolo della rilevanza per ogni immagine<br>
*Ogni 24 ore viene ricalcalcola la lista*<br /><br />
Sono presi in considerazione i seguenti valori:
- Data di caricamento dell'immagine (più l'immagine è recente, più è rilveante)
- Voto medio dell'immagine (weight: 5)
- Numero di voti dell'immagine (weight: 3)

La lista ordinata di `REDIS` è strutturata nel modo seguente:
- score: rilevanza della foto calcolata
- value: dati utili alla visualizzazione della foto

| score | value |
|:---:|:---:|
| 25.6 | { image.jpg, metadata } |
| 16.5 | { image.jpg, metadata } |
| 12.8 | { image.jpg, metadata } |
| 3.0 | { image.jpg, metadata } |
| 1.7 | { image.jpg, metadata } |
<br />
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
<br />
*esempio di visualizazzione*

---
<br>

## RABBITMQ

### ELABORAZIONE DELLE IMMAGINI CARICATE
Quando un'immagine è caricata correttamente su `S3` e aggiunta a `RDS` viene aggiunta un'operazione alla coda di `RabbitMQ`<br>
Una volta che la foto è stata ridimensionata viene caricata su `S3` e successivamente aggiornato il record su `RDS`<br />
Di seguito viene inviata una notifica l client in ascolto per dargli la possibilità di aggiungere un titolo, una descrizione ed eventuali tag

---
<br>

## ELASTIC SEARCH

### FUNZIONE RICERCA
Ad ogni upload viene aggiornato elastic search per permettere di cercare le foto secondo i loro titolo, descrizione e tags, nonchè per utente
Elastic search torna una corrispondenza anche di parole visibilmente simili a quelle ricercare (errori di battitura)

---
<br>
`by Marco Stevanon`