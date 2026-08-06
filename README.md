![image](https://github.com/user-attachments/assets/932ead13-9c8c-4178-8074-29a8bab10054)

Old project, not finished, currently trying an approach with grid cells, but may not.

Each layout is a seperate webpage. They persist on disk. Each boxhas it's own css, js, html that you can configure in the browser.
Drag and position the boxes etc. 

## Running

```
q datom_server.q      # from the repo root -- PROJ_ROOT is taken from the cwd
```

Then open http://localhost:5002/datom.html

Click anywhere on the grid to drop a box. Drag it by its header, resize from the
bottom-right corner, and open the code editor from the `<>` button. Boxes are
positioned as CSS grid areas, so a saved layout restores exactly where you left it.

ace and apexcharts load from a CDN, so the first run needs a network connection.

![datomRecording-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/049a36f6-37b5-4327-a16c-4322e7306bc3)
![datomRecording-ezgif com-video-to-gif-converter (1)](https://github.com/user-attachments/assets/b6e3d595-0d37-4387-a8cf-1ef2d67b30ef)
