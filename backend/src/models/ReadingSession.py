class ReadingSession:
    def __init__(self, id, book_id, date, minutes_read):
        self.__id = id
        self.__book_id = book_id
        self.__date = date
        self.__minutes_read = minutes_read
    
    #Getters
    def get_id(self):
        return self.__id
    
    def get_book_id(self):
        return self.__book_id
    
    def get_date(self):
        return self.__date
    
    def get_minutes_read(self):
        return self.__minutes_read

    #Setters

    def set_id(self, id):
        self.__id = id
    
    def set_book_id(self, book_id):
        self.__book_id = book_id
    
    def set_date(self, date):
        self.__date = date

    def set_minutes_read(self, minutes_read):
        self.__minutes_read = minutes_read

    def to_dict(self):
        return {
            'id': self.__id,
            'book_id': self.__book_id,
            'date': self.__date,
            'minutes_read': self.__minutes_read
        }