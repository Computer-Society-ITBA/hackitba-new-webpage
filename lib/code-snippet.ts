export const codeSnippet = `import random, math, time, sys, hashlib, string

print("\\nBOOTING MINI UNIVERSE\\n")

w = 70
h = 22
stars = [(random.random()*w, random.random()*h, random.random()*2+0.5) for _ in range(120)]

print("Starfield:\\n")
[print("".join("*" if any(abs((sx+math.sin(time.time())*sp)%w-i)<0.7 and abs((sy+math.cos(time.time())*sp)%h-j)<0.7 for sx,sy,sp in stars) else " " for i in range(w))) for j in range(h)]

print("\\nEstimating π...")
inside = sum(1 for _ in range(50000) if random.uniform(-1,1)**2+random.uniform(-1,1)**2<=1)
print("π ≈", 4.0*inside/50000.0)

print("\\nProcedural Poem:\\n" + "\\n".join((" ".join(random.choice(["quantum","banana","nebula","espresso","entropy","whisper","glitch","cosmos","algorithm","paradox","pixel","gravity","noodle","asteroid","syntax","dream","matrix","singularity"]) for _ in range(random.randint(5,10)))).capitalize()+"." for _ in range(15)))

print("\\nDice roll stats:")
rolls = [random.randint(1,6) for _ in range(2000)]
print({i:rolls.count(i) for i in range(1,7)})

print("\\nSHA256 of cosmic phrase:")
print(hashlib.sha256(b'THE UNIVERSE IS A STRANGE LOOP').hexdigest())

print("\\nFibonacci:")
a = 0
b = 1
exec("for _ in range(25): print(a,end=' '); a,b=b,a+b")

print("\\n\\nPrimes under 300:")
print([n for n in range(2,300) if all(n%d for d in range(2,int(math.sqrt(n))+1))])

print("\\nRandom Password:")
chars = string.ascii_letters + string.digits + '!@#$%^&*()'
print(''.join(random.choice(chars) for _ in range(32)))

print("\\nSorting demo:")
nums = [random.randint(0,1000) for _ in range(40)]
print("Before:", nums)
print("After :", sorted(nums))

print("\\nCellular Automaton:")
cells = [random.choice([0,1]) for _ in range(80)]
print(''.join('#' if c else '.' for c in cells))
cells = [cells[i-1]^cells[i]^cells[(i+1)%len(cells)] for i in range(len(cells))]
print(''.join('#' if c else '.' for c in cells))

print("\\nRandom Walk:")
x = 0
y = 0
steps = [random.choice([(1,0),(-1,0),(0,1),(0,-1)]) for _ in range(300)]
[exec("x+=dx;y+=dy") for dx,dy in steps]
print("Final position:", (x,y))

print("\\nMatrix multiplication:")
A = [[random.randint(0,5) for _ in range(3)] for _ in range(3)]
B = [[random.randint(0,5) for _ in range(3)] for _ in range(3)]
C = [[sum(A[i][k]*B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
print("A=", A)
print("B=", B)
print("A*B=", C)

t = time.localtime()
print("\\nBinary clock:", bin(t.tm_hour)[2:].zfill(5), bin(t.tm_min)[2:].zfill(6), bin(t.tm_sec)[2:].zfill(6))

print("\\nFinal lucky number:", random.randint(1,1000))
print("\\nUNIVERSE SIMULATION COMPLETE\\n")`.replaceAll("\n", "; ").repeat(2);
