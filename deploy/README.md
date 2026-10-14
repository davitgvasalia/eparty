# საჯარო სერვერზე გაშვება

სერვერი: **Ubuntu 24.04 VPS**, მინიმუმ 2 vCPU, 2–4 GB RAM, 40 GB SSD.

| ფაილი | რას აკეთებს |
|---|---|
| `setup-server.sh` | ახალი სერვერის ერთჯერადი მომზადება: Node.js 22, PostgreSQL, nginx, HTTPS, firewall, swap, სერვისი, სარეზერვო ასლი |
| `deploy.sh` | განახლება: ახალი კოდი → build → ბაზის მიგრაცია → რესტარტი |
| `backup.sh` | ბაზის და ID ფოტოების ასლი (ყოველდღე 03:00, ინახება 14 დღე) |
| `eparty.service` | systemd სერვისი (აპი თავად ირთვება სერვერის გადატვირთვისას) |
| `nginx.conf` | nginx: დომენი → აპი |

სერვერზე ყველაფერი `/srv/eparty`-შია:

```
/srv/eparty/app          კოდი (git)
/srv/eparty/storage/ids  პირადობის ფოტოები (მხოლოდ აპს აქვს წვდომა)
/srv/eparty/backups      სარეზერვო ასლები
/srv/eparty/.db-password ბაზის პაროლი
```

## 1. სანამ დაიწყებთ

1. **კოდი GitHub-ზე.** შექმენით **private** რეპოზიტორია და ატვირთეთ კოდი (`git remote add origin ...` → `git push -u origin main`).
2. **დომენი.** რეგისტრატორთან დაამატეთ ორი **A** ჩანაწერი VPS-ის IP-ზე: `@` (მაგ. `eparty.ge`) და `www`. DNS-ის გავრცელებას რამდენიმე წუთიდან რამდენიმე საათამდე სჭირდება. შემოწმება: `ping eparty.ge` უნდა აჩვენებდეს სერვერის IP-ს.

## 2. სერვერის მომზადება

```bash
ssh root@<სერვერის-IP>

# აპის მომხმარებლის SSH გასაღები, რომ სერვერმა private რეპოზიტორია წაიკითხოს
useradd --system --create-home --home-dir /srv/eparty --shell /bin/bash eparty
sudo -u eparty mkdir -m 700 -p /srv/eparty/.ssh
sudo -u eparty ssh-keygen -t ed25519 -N "" -f /srv/eparty/.ssh/id_ed25519
cat /srv/eparty/.ssh/id_ed25519.pub
```

დაკოპირებული გასაღები დაამატეთ GitHub-ზე: **Repository → Settings → Deploy keys → Add deploy key** (Allow write access **არ** მონიშნოთ). შემდეგ:

```bash
sudo -u eparty ssh -o StrictHostKeyChecking=accept-new -T git@github.com   # "successfully authenticated"

sudo -u eparty git clone git@github.com:<თქვენი-github>/eparty.git /srv/eparty/app

bash /srv/eparty/app/deploy/setup-server.sh eparty.ge თქვენი@ელფოსტა.ge git@github.com:<თქვენი-github>/eparty.git 4aTUdRY349c98Ru2PNcNFWBUaZGa89zZvT3f5dBxyfp8
```

ბოლოს გამოჩნდება `Done. Open https://eparty.ge`. ელ-ფოსტა certbot-ს სჭირდება HTTPS სერტიფიკატის ვადის შეხსენებისთვის.

## 3. პირველი შესვლა

გახსენით საიტი და შედით ადმინისტრატორის ვოლეტით. ჩანაწერი ავტომატურად შეიქმნება სახელით „ადმინისტრატორი“. სახელის შესაცვლელად:

```bash
sudo -u postgres psql eparty -c "UPDATE \"Member\" SET \"nameKa\"='დავით გვასალია', \"nameEn\"='Davit Gvasalia' WHERE role='admin';"
```

## 4. განახლება

კომპიუტერზე ცვლილებების შემდეგ: `git push`. სერვერზე:

```bash
sudo /srv/eparty/app/deploy/deploy.sh
```

## 5. ყოველდღიური საქმეები

```bash
systemctl status eparty              # მუშაობს თუ არა
journalctl -u eparty -n 100 -f       # ლოგები
sudo /srv/eparty/app/deploy/backup.sh  # სარეზერვო ასლი ახლავე
```

**აღდგენა ასლიდან:**

```bash
systemctl stop eparty
sudo -u postgres pg_restore --clean --if-exists -d eparty /srv/eparty/backups/db-<თარიღი>.dump
tar -xzf /srv/eparty/backups/storage-<თარიღი>.tar.gz -C /srv/eparty/storage/ids
systemctl start eparty
```

სარეზერვო ასლები იმავე სერვერზეა. თუ სერვერი დაზიანდა, ისინიც დაიკარგება, ამიტომ პერიოდულად გადმოწერეთ სხვაგან:
`scp root@<IP>:/srv/eparty/backups/* ./backups/`.

## უსაფრთხოება

- `.env` და `.db-password` სერვერზე იქმნება და git-ში **არასოდეს** ხვდება.
- ID ფოტოები `public/`-ის გარეთაა და მხოლოდ ადმინისტრატორს უჩანს.
- გარედან ღიაა მხოლოდ პორტები 22 (SSH), 80 და 443. აპი (3000) და PostgreSQL (5432) მხოლოდ სერვერის შიგნითაა ხელმისაწვდომი.
- რეკომენდებულია SSH-ში პაროლით შესვლის გათიშვა და მხოლოდ გასაღებით შესვლა.
