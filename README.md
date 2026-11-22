# potlerh
Web page for generating wiremesh obj files

## Functionalities
- move around
    - distance: the scrollwheel changes the distance to the object
    - rotation: pressing the scrollwheel or using the arrow keys will rotate the object around the camera
- download/copy: download the obj file with the download button or copy the text from the second text field
- read: read the provided text after pressing enter if it is in the correct formatting
- select: select points by clicking on them while pressing the Ctrl key

## Functions in interact mode
- [space] -- press space to return to normal mode
- "a" -- press "a" to create a point in the middle of the 2 selected points and connect them to the new point
- "c" -- press "c" to connect two points
- "x" -- press "x" to cut the connection between points
- "c -- press "c" to remove the selected points
- "1","2" -- press these to set the view angle respectively to top and bottom

## Commands in normal mode

- :clear -- Remove all vertices

- :submit -- Submit object file

- sel -- Add index to selection

- :cube -- Generate cube

- :rot -- Start rotation with default speed

- :srot -- Stop rotation

- :initrot -- Set rotation to default

- xangle= -- Set yangle

- yangle= -- Set yangle

- +=xangle -- Add following angle to xangle

- +=yangle -- Add following angle to yangle

- dx= -- Set deltax

- dy= -- Set deltay

- dz= -- Set deltaz

- ./[file] -- Open file

- :xrot -- yanglev=rotationspeed

- :yrot -- yanglev=rotationspeed

- :drawv -- Toggle draw-vertices mode

- :ccld -- Generate cilinder

- :gsphere -- Generate sphere

- :d -- Set distance to default

- :init -- Set initial conditions

- :interact -- Set interact mode to interact

- :circle -- Generate circunference

- :showi -- Toggle show-index mode