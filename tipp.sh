ls -S dst | xargs -n 1 -I "{}" echo tippecanoe --minimum-zoom=10 --maximum-zoom=15 --base-zoom=15 --read-parallel -f --simplification=2 -o mbtiles/"{}".mbtiles dst/"{}"
