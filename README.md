#Isosurface voxel experiment

play at 
https://isosurface.surge.sh/

Explore mysterious ruins. Locate The Artifact. 

WASD and mouse to move around, the goal is to find The Artifact. Collision detection raycasting is only done below and in front ... so walking backwards you can fall through the landscape...

Currently, code is an absolute mess, but it works.

Uses density function to generate isosurfaces for landscape, loading of terain chunks done in web worker. 
All assets are generative - even the music is ( badly ) generated. 
