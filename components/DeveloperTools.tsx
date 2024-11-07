"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function DeveloperTools() {
  const [code, setCode] = useState(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Space Invaders</title>
        <style>
            body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #000; }
            #gameCanvas { border: 2px solid #fff; }
        </style>
    </head>
    <body>
        <canvas id="gameCanvas" width="400" height="400"></canvas>
        <script>
            const canvas = document.getElementById('gameCanvas');
            const ctx = canvas.getContext('2d');

            let player = { x: 175, y: 350, width: 50, height: 20 };
            let bullets = [];
            let enemies = [];
            let score = 0;
            let gameOver = false;

            function drawPlayer() {
                ctx.fillStyle = '#00ff00';
                ctx.fillRect(player.x, player.y, player.width, player.height);
            }

            function drawBullets() {
                ctx.fillStyle = '#fff';
                bullets.forEach(bullet => {
                    ctx.fillRect(bullet.x, bullet.y, 5, 10);
                });
            }

            function drawEnemies() {
                ctx.fillStyle = '#ff0000';
                enemies.forEach(enemy => {
                    ctx.fillRect(enemy.x, enemy.y, 30, 30);
                });
            }

            function moveBullets() {
                bullets.forEach(bullet => {
                    bullet.y -= 5;
                });
                bullets = bullets.filter(bullet => bullet.y > 0);
            }

            function moveEnemies() {
                enemies.forEach(enemy => {
                    enemy.y += 1;
                });
            }

            function checkCollisions() {
                enemies.forEach((enemy, enemyIndex) => {
                    bullets.forEach((bullet, bulletIndex) => {
                        if (bullet.x < enemy.x + 30 &&
                            bullet.x + 5 > enemy.x &&
                            bullet.y < enemy.y + 30 &&
                            bullet.y + 10 > enemy.y) {
                            enemies.splice(enemyIndex, 1);
                            bullets.splice(bulletIndex, 1);
                            score += 10;
                        }
                    });
                    if (enemy.y + 30 > player.y) {
                        gameOver = true;
                    }
                });
            }

            function drawScore() {
                ctx.fillStyle = '#fff';
                ctx.font = '20px Arial';
                ctx.fillText('Score: ' + score, 10, 30);
            }

            function gameLoop() {
                if (gameOver) {
                    ctx.fillStyle = '#fff';
                    ctx.font = '40px Arial';
                    ctx.fillText('Game Over', 100, 200);
                    ctx.font = '20px Arial';
                    ctx.fillText('Click to restart', 130, 250);
                    return;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                if (Math.random() < 0.02) {
                    enemies.push({ x: Math.random() * (canvas.width - 30), y: 0 });
                }

                drawPlayer();
                drawBullets();
                drawEnemies();
                drawScore();

                moveBullets();
                moveEnemies();
                checkCollisions();

                requestAnimationFrame(gameLoop);
            }

            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                player.x = e.clientX - rect.left - player.width / 2;
            });

            canvas.addEventListener('click', () => {
                if (gameOver) {
                    gameOver = false;
                    player = { x: 175, y: 350, width: 50, height: 20 };
                    bullets = [];
                    enemies = [];
                    score = 0;
                    gameLoop();
                } else {
                    bullets.push({ x: player.x + player.width / 2 - 2.5, y: player.y });
                }
            });

            gameLoop();
        </script>
    </body>
    </html>
  `);

  const [livePreview, setLivePreview] = useState(code);

  useEffect(() => {
    setLivePreview(code);
  }, [code]);

  return (
    <section className="mb-12">
      <h2 className="text-3xl font-semibold mb-8 text-center">
        Deploy Your Website on Smart Contracts
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-secondary relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              Coming Soon
            </span>
          </div>
          <CardHeader>
            <CardTitle>Smart Contract Deployment</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-background p-4 rounded-md opacity-50">
              <code>$ http3 deploy ./my-website</code>
            </pre>
            <p className="mt-4 text-sm text-muted-foreground opacity-50">
              Deploy your website directly to the blockchain using our CLI tool.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>Instant Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-background p-4 rounded-md">
              <code>Preview: https://ba..ipfs.link/</code>
            </pre>
            <p className="mt-4 text-sm text-muted-foreground">
              Get an instant preview link to share your deployed website.
            </p>
          </CardContent>
        </Card>
        <Card className="bg-secondary">
          <CardHeader>
            <CardTitle>Web3 Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-background p-4 rounded-md text-center">
              Smart Contract Interaction
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Easily integrate Web3 functionality into your deployed website.
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="editor" className="space-y-4">
            <TabsList>
              <TabsTrigger value="editor">Code Editor</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="code-editor" className="text-lg">
                    Code Editor
                  </Label>
                  <Textarea
                    id="code-editor"
                    placeholder="Enter your HTML/CSS/JavaScript code here"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      setLivePreview(e.target.value);
                    }}
                    className="min-h-[400px] font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="live-preview" className="text-lg">
                    Live Preview
                  </Label>
                  <div className="border rounded-lg overflow-hidden h-[400px] bg-white">
                    <iframe
                      id="live-preview"
                      srcDoc={livePreview}
                      className="w-full h-full"
                      title="Live Preview"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
