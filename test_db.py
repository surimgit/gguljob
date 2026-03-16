import mysql.connector

conn = mysql.connector.connect(host='127.0.0.1', port=3307, user='root', password='TAiqM4E#+kMtwXCS', database='gguljob_dev')
cursor = conn.cursor()

cursor.execute("SELECT count(*) FROM job_posting WHERE requirements LIKE '%학사%' OR requirements LIKE '%대졸%' OR requirements LIKE '%전공%' OR position_details LIKE '%학사%'")
print('Jobs mentioning Education/Degree:', cursor.fetchone()[0])
conn.close()
